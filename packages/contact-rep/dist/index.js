import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
/**
 * Embeddable Canadian "Contact Your Elected Representative" widget for React
 * and Next.js applications.
 *
 * Renders an auto-resizing Vote Social constituent carousel along with a
 * native host-DOM attribution bar linking to Open North and Vote Social.
 */
export function VoteSocialContactRep({ tier, defaultSubject, defaultBody, defaultPostcode, baseUrl = "https://vote-social.ca", className, }) {
    const iframeRef = useRef(null);
    const [iframeHeight, setIframeHeight] = useState(440);
    useEffect(() => {
        function handleMessage(event) {
            if (!event.data ||
                typeof event.data !== "object" ||
                event.data.type !== "vote-social:resize") {
                return;
            }
            if (iframeRef.current &&
                event.source &&
                iframeRef.current.contentWindow !== event.source) {
                return;
            }
            const nextHeight = Number(event.data.height);
            if (nextHeight >= 240 && nextHeight <= 2400) {
                setIframeHeight(Math.ceil(nextHeight));
            }
        }
        window.addEventListener("message", handleMessage);
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, []);
    const cleanBase = baseUrl.replace(/\/+$/, "");
    const params = new URLSearchParams();
    if (tier)
        params.set("tier", tier);
    if (defaultSubject)
        params.set("subject", defaultSubject);
    if (defaultBody)
        params.set("body", defaultBody);
    if (defaultPostcode)
        params.set("postcode", defaultPostcode);
    const query = params.toString();
    const src = `${cleanBase}/embed/contact-rep/${query ? `?${query}` : ""}`;
    return (_jsx("div", { className: className, style: {
            maxWidth: "640px",
            margin: "0 auto",
            width: "100%",
        }, children: _jsx("iframe", { ref: iframeRef, src: src, title: "Contact Your Elected Representative \u2014 Vote Social", loading: "lazy", style: {
                width: "100%",
                height: `${iframeHeight}px`,
                border: "0",
                overflow: "hidden",
                transition: "height 0.25s ease",
            } }) }));
}
export default VoteSocialContactRep;
