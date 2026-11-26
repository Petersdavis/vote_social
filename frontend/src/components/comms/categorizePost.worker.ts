import { env, pipeline } from "@huggingface/transformers";

env.allowLocalModels = false;

type WorkerRequest = {
  id: string;
  text: string;
};

type WorkerResponse = WorkerRequest & {
  vector: Float32Array;
  source: "huggingface" | "fallback";
};

let extractor: any = null;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function createFallbackVector(text: string): Float32Array {
  const dimensions = 384;
  const vector = new Float32Array(dimensions);
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    vector[0] = 1;
    return vector;
  }

  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const bucket = (charCode * 31 + i * 17) % dimensions;
    vector[bucket] += 1;

    if (i < normalized.length - 1) {
      const bigram =
        normalized.charCodeAt(i) * 131 + normalized.charCodeAt(i + 1) * 17;
      vector[bigram % dimensions] += 1.75;
    }
  }

  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;

  for (let i = 0; i < vector.length; i++) {
    vector[i] = vector[i] / norm;
  }

  return vector;
}

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
      dtype: "q8",
    });
  }

  return extractor;
}

const workerScope = self as any;

workerScope.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, text } = event.data;

  try {
    const model = await getExtractor();
    const output = await model(text, { pooling: "mean", normalize: true });
    const vector = new Float32Array(output.data as Float32Array | number[]);

    const response: WorkerResponse = {
      id,
      text,
      vector,
      source: "huggingface",
    };

    workerScope.postMessage(response, [vector.buffer]);
  } catch {
    const vector = createFallbackVector(text);
    const response: WorkerResponse = {
      id,
      text,
      vector,
      source: "fallback",
    };

    workerScope.postMessage(response, [vector.buffer]);
  }
};

export {};
