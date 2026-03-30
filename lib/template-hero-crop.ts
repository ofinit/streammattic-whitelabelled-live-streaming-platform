/** Hero image is shown in a circular frame; offer circular crop on upload for these templates only. */
export const TEMPLATE_IDS_CIRCULAR_HERO_IMAGE = new Set(["tpl-funeral", "tpl-birthday-party"])

export function templateUsesCircularHeroCrop(templateId: string | undefined): boolean {
  const id = templateId?.trim() ?? ""
  return TEMPLATE_IDS_CIRCULAR_HERO_IMAGE.has(id)
}
