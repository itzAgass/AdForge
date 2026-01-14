
export interface AdHook {
  type: string;
  text: string;
}

export interface PrimaryText {
  framework: 'PAS' | 'AIDA' | 'BAB';
  content: string;
}

export interface ShortFormVariation {
  content: string;
}

export interface Headline {
  angle: string;
  text: string;
}

export interface Description {
  text: string;
}

export interface CTARecommendation {
  primary: {
    button: string;
    rationale: string;
  };
  secondary: {
    button: string;
    rationale: string;
  };
  funnelGuidance: string;
}

export interface AdCopyPackage {
  assumptions: string[];
  hooks: AdHook[];
  primaryTexts: PrimaryText[];
  shortForms: ShortFormVariation[];
  headlines: Headline[];
  descriptions: Description[];
  ctaRecommendations: CTARecommendation;
}

export interface GenerationState {
  isLoading: boolean;
  error: string | null;
  result: AdCopyPackage | null;
  currentStep: string;
}
