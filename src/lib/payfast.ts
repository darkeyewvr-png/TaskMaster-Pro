import { Plan, SUBSCRIPTION_PLANS, Company, StaffUser } from '../../types';

// PayFast Credentials from environment or defaults provided
export const PAYFAST_CONFIG = {
  merchantId: (typeof process !== 'undefined' && (process.env?.VITE_PAYFAST_MERCHANT_ID || process.env?.PAYFAST_MERCHANT_ID)) || '17605261',
  merchantKey: (typeof process !== 'undefined' && (process.env?.VITE_PAYFAST_MERCHANT_KEY || process.env?.PAYFAST_MERCHANT_KEY)) || 'nopkbqwnsppxi',
  passphrase: (typeof process !== 'undefined' && (process.env?.PAYFAST_PASSPHRASE || process.env?.VITE_PAYFAST_PASSPHRASE)) || 'Y0KCqqbhelK7Q02tlib',
  processUrl: 'https://www.payfast.co.za/eng/process',
  sandboxProcessUrl: 'https://sandbox.payfast.co.za/eng/process',
  returnUrl: 'https://www.taskmasterpro.co.za',
  cancelUrl: 'https://www.taskmasterpro.co.za',
  notifyUrl: 'https://www.taskmasterpro.co.za/api/saas/webhook/payfast',
};

/**
 * Pure JavaScript MD5 implementation to generate PayFast signature
 * without external dependency overhead
 */
function md5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else return lResult ^ lX8 ^ lY8;
  }
  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWordsTempOne = lMessageLength + 8;
    const lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - (lNumberOfWordsTempOne % 64)) / 64;
    const lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let wordToHexValue = '', wordToHexValueTemp = '', lByte, lCount;
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255;
      wordToHexValueTemp = '0' + lByte.toString(16);
      wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
    }
    return wordToHexValue;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Generate PayFast parameter payload and signature for Monthly Subscription
 */
export function buildPayFastSubscriptionPayload(
  plan: Plan,
  company: Company,
  operator?: StaffUser | null
): Record<string, string> {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const formattedAmount = plan.amount.toFixed(2);

  const payload: Record<string, string> = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: PAYFAST_CONFIG.returnUrl,
    cancel_url: PAYFAST_CONFIG.cancelUrl,
    notify_url: PAYFAST_CONFIG.notifyUrl,
    name_first: (operator?.name || company.name || 'Subscriber').trim().split(' ')[0],
    email_address: (operator?.email || company.email || 'billing@company.co.za').trim(),
    m_payment_id: `${company.id.substring(0, 8)}_${plan.id}_${Date.now()}`,
    amount: formattedAmount,
    item_name: `TaskMaster Pro ${plan.name} Subscription`,
    item_description: `Monthly recurring access for ${plan.name} Plan`,
    subscription_type: '1', // 1 = Subscription
    billing_date: tomorrow,
    recurring_amount: formattedAmount,
    frequency: plan.billingFrequency || '3', // 3 = Monthly
    cycles: '0', // 0 = indefinite until cancelled
  };

  // Generate signature according to PayFast spec:
  // URL-encode all key-values, join with &, append passphrase, MD5 hash
  let pfParamString = '';
  Object.keys(payload).forEach(key => {
    const val = payload[key].trim();
    if (val !== '') {
      pfParamString += `${key}=${encodeURIComponent(val)}&`;
    }
  });

  if (PAYFAST_CONFIG.passphrase) {
    pfParamString += `passphrase=${encodeURIComponent(PAYFAST_CONFIG.passphrase.trim())}`;
  } else {
    pfParamString = pfParamString.slice(0, -1);
  }

  payload['signature'] = md5(pfParamString);
  return payload;
}

/**
 * User-defined PayFast checkout handler
 */
export const handlePayFastCheckout = (companyId: string, selectedPlan: Plan) => {
  const metaEnv = (import.meta as any)?.env || {};
  const merchantId = (metaEnv.VITE_PAYFAST_MERCHANT_ID || '17605261') as string;
  const merchantKey = (metaEnv.VITE_PAYFAST_MERCHANT_KEY || 'nopkbqwnsppxi') as string;
  const passphrase = (metaEnv.PAYFAST_PASSPHRASE || 'Y0KCqqbhelK7Q02tlib') as string;

  const payfastUrl = 'https://www.payfast.co.za/eng/process';
  const supabaseRef = (metaEnv.VITE_SUPABASE_PROJECT_REF || 'waapoiruuifhjefbdacr');

  const params: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: `https://www.taskmasterpro.co.za/dashboard?subscription=success`,
    cancel_url: `https://www.taskmasterpro.co.za/pricing?subscription=cancelled`,
    notify_url: `https://${supabaseRef}.functions.supabase.co/payfast-itn`,

    // Order & Tenant Details
    custom_str1: companyId,
    item_name: `TaskMaster Pro - ${selectedPlan.name} Plan`,
    amount: selectedPlan.amount.toFixed(2),

    // PayFast Subscription Fields
    subscription_type: '1', // 1 = Subscription / Recurring
    billing_date: new Date().toISOString().split('T')[0],
    recurring_amount: selectedPlan.amount.toFixed(2),
    frequency: selectedPlan.billingFrequency, // 3 = Monthly
    cycles: '0', // 0 = Infinite until canceled
  };

  // Attach signature if passphrase is present
  if (passphrase) {
    let pfParamString = '';
    Object.keys(params).forEach(key => {
      const val = params[key]?.trim();
      if (val !== '') {
        pfParamString += `${key}=${encodeURIComponent(val)}&`;
      }
    });
    pfParamString += `passphrase=${encodeURIComponent(passphrase.trim())}`;
    params['signature'] = md5(pfParamString);
  }

  // Create temporary hidden form and post to PayFast
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payfastUrl;

  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form);
    }
  }, 1000);
};

/**
 * Opens PayFast secure checkout in new window or form submission
 */
export function submitPayFastSubscription(
  plan: Plan,
  company: Company,
  operator?: StaffUser | null
): void {
  handlePayFastCheckout(company.id, plan);
}
