export const MYFIT_VISUAL_STYLE_VERSION = "myfit-boutique-private-2026-08-v3";

export const myfitStoryCompositions = {
  editorial_split:
    "editorial split composition with cream negative space and the gym photograph carrying the right side",
  photo_forward:
    "bright photo-forward composition with a translucent milky cream editorial panel, thin muted-gold framing and generous breathing room; text-safe space never sits directly over busy photography",
} as const;

export type MyfitStoryComposition = keyof typeof myfitStoryCompositions;

export const myfitVisualTemplates = {
  story_private_benefit: {
    format: "story" as const,
    label: "Story · světlá MyFit",
    backgroundAsset: "/brand/story-light-base.png",
    compositions: ["editorial_split", "photo_forward"] as const,
    imagePrompt:
      "warm natural sunlight in a real private gym, quiet premium editorial photography, authentic equipment, refined cream-black-gold mood and enough negative space for a concise message",
  },
  story_availability: {
    format: "story" as const,
    label: "Story · volné termíny",
    backgroundAsset: "/brand/story-light-base.png",
    compositions: ["editorial_split", "photo_forward"] as const,
    imagePrompt:
      "warm bright private gym with natural window light, calm premium editorial framing and generous negative space for dates and reservation links",
  },
  post_announcement: {
    format: "post" as const,
    label: "Post · světlá boutique novinka",
    backgroundAsset: "/brand/story-light-base.png",
    compositions: [] as const,
    imagePrompt:
      "bright warm boutique private gym, natural golden-hour window light, modern architectural editorial photography, cream sand champagne palette, black equipment as a restrained detail, plant and generous clean negative space for a concise message",
  },
} as const;

export type MyfitVisualTemplate = keyof typeof myfitVisualTemplates;
