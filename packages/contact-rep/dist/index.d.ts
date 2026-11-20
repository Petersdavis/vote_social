import React from "react";
export type VoteSocialGovernanceTier = "municipal" | "regional" | "provincial" | "federal";
export interface VoteSocialContactRepProps {
    /**
     * Optional governance tier filter. When set (e.g. `"federal"`), the widget
     * resolves the constituent's representative for that level directly from their
     * 6-character Canadian postal code.
     */
    tier?: VoteSocialGovernanceTier;
    /** Optional pre-filled campaign subject line */
    defaultSubject?: string;
    /** Optional pre-filled campaign message body */
    defaultBody?: string;
    /** Optional pre-filled 6-character Canadian postal code */
    defaultPostcode?: string;
    /** Optional custom base URL (defaults to "https://vote-social.ca") */
    baseUrl?: string;
    /** Optional container className */
    className?: string;
}
/**
 * Embeddable Canadian "Contact Your Elected Representative" widget for React
 * and Next.js applications.
 *
 * Renders an auto-resizing Vote Social constituent carousel along with a
 * native host-DOM attribution bar linking to Open North and Vote Social.
 */
export declare function VoteSocialContactRep({ tier, defaultSubject, defaultBody, defaultPostcode, baseUrl, className, }: VoteSocialContactRepProps): React.JSX.Element;
export default VoteSocialContactRep;
