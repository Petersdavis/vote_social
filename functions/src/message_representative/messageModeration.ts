const TOXIC_KEYWORDS = [
  "bitch",
  "blackmail",
  "hate",
  "idiot",
  "stupid",
  "cunt",
  "dumbass",
  "bullshit",
  "kill yourself",
  "die",
  "fuck",
  "fucked",
  "fucking",
  "bitcoin",
  "whore",
  "rape",
  "retarded",
];

const URL_REGEX = /https?:\/\/[^\s<>()[\]"']+/gi;
const UTM_PARAM_REGEX = /[?&]utm_[a-z0-9_]+=/i;
const REPEATED_PUNCTUATION_REGEX = /([!?.,])\1{3,}/;
const ALL_CAPS_WORD_REGEX = /\b[A-Z]{6,}\b/;
const EXCESSIVE_ASCII_RUN_REGEX = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}/;

function normalizeTextForScoring(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function extractUrls(text: string): string[] {
  return text.match(URL_REGEX) ?? [];
}

export interface MessageRiskInput {
  senderName: string;
  senderEmail: string;
  subject: string;
  body: string;
}

export interface MessageRiskResult {
  flagged: boolean;
  score: number;
  reasons: string[];
}

/**
 * Quick-and-dirty message moderation heuristic.
 *
 * Rules:
 * - Any URL with UTM parameters is an immediate failure.
 * - More than 3 URLs is an immediate failure.
 * - Excessive ASCII symbol runs are an immediate failure.
 * - Otherwise, additional weak signals can still accumulate to a flag.
 */
export function evaluateMessageRisk(input: MessageRiskInput): MessageRiskResult {
  const reasons: string[] = [];
  let score = 0;

  if (input.body.length > 1500) {
    score += 1;
    return {
      flagged: true,
      score: score + 5,
      reasons: [...reasons, "long_message"],
    };
  }

  if (input.body.length < 25) {
    return {
      flagged: true,
      score: score + 5,
      reasons: [...reasons, "long_message"],
    };
  }

  const combined = normalizeTextForScoring(
    `${input.senderName} ${input.senderEmail} ${input.subject} ${input.body}`,
  );

  const combinedLower = combined.toLocaleLowerCase();

  for (const keyword of TOXIC_KEYWORDS) {
    if (combinedLower.includes(` ${keyword} `)) {
      score += 2;
      reasons.push(`keyword:${keyword}`);
    }
  }

  const urls = extractUrls(combinedLower);
  if (urls.length > 3) {
    return {
      flagged: true,
      score: score + 5,
      reasons: [...reasons, "too_many_urls"],
    };
  }

  for (const url of urls) {
    if (UTM_PARAM_REGEX.test(url)) {
      return {
        flagged: true,
        score: score + 5,
        reasons: [...reasons, "utm_params_in_url"],
      };
    }
  }

  if (
    EXCESSIVE_ASCII_RUN_REGEX.test(input.body) ||
    EXCESSIVE_ASCII_RUN_REGEX.test(input.subject)
  ) {
    return {
      flagged: true,
      score: score + 5,
      reasons: [...reasons, "excessive_ascii_symbols"],
    };
  }

  if (REPEATED_PUNCTUATION_REGEX.test(input.body)) {
    score += 1;
    reasons.push("repeated_punctuation");
  }

  if (ALL_CAPS_WORD_REGEX.test(input.body) || ALL_CAPS_WORD_REGEX.test(input.subject)) {
    score += 1;
    reasons.push("shouting_caps");
  }

  return {
    flagged: score >= 3,
    score,
    reasons,
  };
}
