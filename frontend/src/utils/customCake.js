/** Session payload from `/custom-cake` → prefilled at checkout */
export const CUSTOM_CAKE_STORAGE_KEY = 'customCakeRequest';

export function loadCustomCakeRequest() {
  try {
    const raw = sessionStorage.getItem(CUSTOM_CAKE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCustomCakeRequest(data) {
  sessionStorage.setItem(CUSTOM_CAKE_STORAGE_KEY, JSON.stringify(data));
}

export function clearCustomCakeRequest() {
  sessionStorage.removeItem(CUSTOM_CAKE_STORAGE_KEY);
}

/** Readable block appended to order notes */
export function formatCustomCakeNotes(data) {
  if (!data || typeof data !== 'object') return '';
  const lines = [
    '[Custom cake — builder]',
    data.designTheme && `Theme: ${data.designTheme}`,
    data.themeColor && `Color: ${data.themeColor}`,
    data.servingWeight && `Serving size: ${data.servingWeight}`,
    data.flavour && `Flavour: ${data.flavour}`,
    data.customFlavour && `Custom flavour note: ${data.customFlavour}`,
    data.eggless != null && `Eggless: ${data.eggless ? 'Yes' : 'No'}`,
    // toppings removed from custom cake builder
    Array.isArray(data.extras) &&
      data.extras.length > 0 &&
      `Extras: ${data.extras.join(', ')}`,
    data.messageOnCake?.trim() &&
      `Message on cake: ${data.messageOnCake.trim()}`,
    data.preferredDate && `Preferred ready-by: ${data.preferredDate}`,
    data.extraNotes && `Extra: ${data.extraNotes}`,
    data.estimatedPrice && `Estimated price: ₹${data.estimatedPrice}`,
  ].filter(Boolean);
  return lines.join('\n');
}
