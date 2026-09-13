/* Shared SVG symbol sheet for the BeePOS mockups.
   Injected synchronously next to the script tag so every <use href="#..."> resolves during
   parse, which also works from file:// where fetching an external sprite would not.
   Contains the 20 lucide UI icons the app needs plus 8 product illustrations that stand in
   for real photography. */
(function () {
  var SPRITE = '<symbol id="i-alert" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></symbol>' +
    '<symbol id="i-banknote" viewBox="0 0 24 24"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01"/><path d="M18 12h.01"/></symbol>' +
    '<symbol id="i-card" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></symbol>' +
    '<symbol id="i-cart" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></symbol>' +
    '<symbol id="i-chart" viewBox="0 0 24 24"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></symbol>' +
    '<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>' +
    '<symbol id="i-chevron-left" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></symbol>' +
    '<symbol id="i-chevron-right" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></symbol>' +
    '<symbol id="i-ellipsis" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></symbol>' +
    '<symbol id="i-filter" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></symbol>' +
    '<symbol id="i-hex" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></symbol>' +
    '<symbol id="i-idcard" viewBox="0 0 24 24"><path d="M16 10h2"/><path d="M16 14h2"/><path d="M6.17 15a3 3 0 0 1 5.66 0"/><circle cx="9" cy="11" r="2"/><rect x="2" y="5" width="20" height="14" rx="2"/></symbol>' +
    '<symbol id="i-minus" viewBox="0 0 24 24"><path d="M5 12h14"/></symbol>' +
    '<symbol id="i-package" viewBox="0 0 24 24"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></symbol>' +
    '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M5 12h14"/><path d="M12 5v14"/></symbol>' +
    '<symbol id="i-qr" viewBox="0 0 24 24"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></symbol>' +
    '<symbol id="i-receipt" viewBox="0 0 24 24"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M14 8H8"/><path d="M16 12H8"/><path d="M13 16H8"/></symbol>' +
    '<symbol id="i-scan" viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 7v10"/><path d="M12 7v10"/><path d="M17 7v10"/></symbol>' +
    '<symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></symbol>' +
    '<symbol id="i-settings" viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></symbol>' +
    '<symbol id="i-star" viewBox="0 0 24 24"><path d="M11.5 2.6a.6.6 0 0 1 1 0l2.5 5 5.5.8a.6.6 0 0 1 .3 1l-4 3.9.9 5.5a.6.6 0 0 1-.8.6L12 16.8l-4.9 2.6a.6.6 0 0 1-.8-.6l.9-5.5-4-3.9a.6.6 0 0 1 .3-1l5.5-.8z"/></symbol>' +
    '<symbol id="i-store" viewBox="0 0 24 24"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></symbol>' +
    '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></symbol>' +
    '<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></symbol>' +
    '<symbol id="i-users" viewBox="0 0 24 24"><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/></symbol>' +
    '<symbol id="i-warehouse" viewBox="0 0 24 24"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M6 10h12v12H6z"/></symbol>' +
    '<symbol id="i-x" viewBox="0 0 24 24"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></symbol>' +
    '<!-- Product illustrations. Flat vector stand-ins for real photography: the tile reserves a' +
    '     real image slot and phase 2 swaps these for expo-image. Colour comes from the category' +
    '     accent through currentColor. -->' +
    '<symbol id="p-bottle" viewBox="0 0 64 64">' +
    '  <rect x="27" y="7" width="10" height="7" rx="1.5" fill="currentColor" opacity=".8"/>' +
    '  <path d="M27 14h10v5c0 3.5 5 5.5 5 11.5V52a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V30.5c0-6 5-8 5-11.5z" fill="currentColor" opacity=".16"/>' +
    '  <path d="M22 33h20v12H22z" fill="currentColor" opacity=".5"/>' +
    '  <path d="M27 14h10v5c0 3.5 5 5.5 5 11.5V52a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V30.5c0-6 5-8 5-11.5z" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '</symbol>' +
    '<symbol id="p-can" viewBox="0 0 64 64">' +
    '  <rect x="22" y="11" width="20" height="42" rx="4.5" fill="currentColor" opacity=".16"/>' +
    '  <rect x="22" y="26" width="20" height="13" fill="currentColor" opacity=".5"/>' +
    '  <rect x="22" y="11" width="20" height="42" rx="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '  <path d="M24 16h16" stroke="currentColor" stroke-width="2.2" opacity=".55"/>' +
    '</symbol>' +
    '<symbol id="p-carton" viewBox="0 0 64 64">' +
    '  <path d="M24 20 32 9l8 11v32a3 3 0 0 1-3 3H27a3 3 0 0 1-3-3z" fill="currentColor" opacity=".16"/>' +
    '  <path d="M24 20 32 9l8 11z" fill="currentColor" opacity=".42"/>' +
    '  <path d="M24 31h16v12H24z" fill="currentColor" opacity=".5"/>' +
    '  <path d="M24 20 32 9l8 11v32a3 3 0 0 1-3 3H27a3 3 0 0 1-3-3z" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '</symbol>' +
    '<symbol id="p-sachet" viewBox="0 0 64 64">' +
    '  <rect x="15" y="13" width="34" height="38" rx="3" fill="currentColor" opacity=".16"/>' +
    '  <rect x="15" y="13" width="34" height="38" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '  <path d="M15 20h34M15 44h34" stroke="currentColor" stroke-width="2.2" opacity=".45"/>' +
    '  <circle cx="32" cy="32" r="7" fill="currentColor" opacity=".5"/>' +
    '</symbol>' +
    '<symbol id="p-bag" viewBox="0 0 64 64">' +
    '  <path d="M20 21c0-4 5-7 12-7s12 3 12 7v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="currentColor" opacity=".16"/>' +
    '  <path d="M20 30h24v13H20z" fill="currentColor" opacity=".5"/>' +
    '  <path d="M20 21c0-4 5-7 12-7s12 3 12 7v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '  <path d="M24 15c2.5 3 13.5 3 16 0" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '</symbol>' +
    '<symbol id="p-jar" viewBox="0 0 64 64">' +
    '  <rect x="26" y="7" width="12" height="6" rx="1.5" fill="currentColor" opacity=".8"/>' +
    '  <path d="M22 21a7 7 0 0 1 7-7h6a7 7 0 0 1 7 7v30a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="currentColor" opacity=".16"/>' +
    '  <path d="M22 29h20v14H22z" fill="currentColor" opacity=".5"/>' +
    '  <path d="M22 21a7 7 0 0 1 7-7h6a7 7 0 0 1 7 7v30a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '</symbol>' +
    '<symbol id="p-box" viewBox="0 0 64 64">' +
    '  <path d="M14 23 20 13h24l6 10v28a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z" fill="currentColor" opacity=".16"/>' +
    '  <path d="M14 23 20 13h24l6 10z" fill="currentColor" opacity=".42"/>' +
    '  <path d="M14 23 20 13h24l6 10v28a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3z" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '  <path d="M32 13v41" stroke="currentColor" stroke-width="2.2" opacity=".45"/>' +
    '</symbol>' +
    '<symbol id="p-multipack" viewBox="0 0 64 64">' +
    '  <rect x="13" y="22" width="38" height="31" rx="3" fill="currentColor" opacity=".16"/>' +
    '  <rect x="13" y="22" width="38" height="31" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '  <path d="M23 22v-3a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v3" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
    '  <path d="M25.7 22v31M38.3 22v31M13 37.5h38" stroke="currentColor" stroke-width="2.2" opacity=".45"/>' +
    '</symbol>' +
    '<symbol id="i-lock" viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>' +
    '<symbol id="i-mail" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></symbol>' +
    '<symbol id="i-key" viewBox="0 0 24 24"><path d="M2.6 17.4A2 2 0 0 0 2 18.8V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.2a2 2 0 0 0 1.4-.6l.8-.8a6.5 6.5 0 1 0-4-4z"/><path d="M16.5 7.5h.01"/></symbol>' +
    '<symbol id="i-eye" viewBox="0 0 24 24"><path d="M2.1 12.3a1 1 0 0 1 0-.7 10.8 10.8 0 0 1 19.9 0 1 1 0 0 1 0 .7 10.8 10.8 0 0 1-19.9 0"/><circle cx="12" cy="12" r="3"/></symbol>' +
    '<symbol id="i-backspace" viewBox="0 0 24 24"><path d="M10 5a2 2 0 0 0-1.3.5l-6.4 5.8a1 1 0 0 0 0 1.5l6.4 5.7A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"/><path d="m12 9 6 6"/><path d="m18 9-6 6"/></symbol>' +
    '<symbol id="i-truck" viewBox="0 0 24 24"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></symbol>' +
    '<symbol id="i-tag" viewBox="0 0 24 24"><path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><path d="M7.5 7.5h.01"/></symbol>' +
    '<symbol id="i-clipboard" viewBox="0 0 24 24"><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></symbol>' +
    '<symbol id="i-user-plus" viewBox="0 0 24 24"><path d="M2 21a8 8 0 0 1 13.29-6"/><circle cx="10" cy="8" r="5"/><path d="M19 16v6"/><path d="M22 19h-6"/></symbol>' +
    '<symbol id="i-printer" viewBox="0 0 24 24"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></symbol>' +
    '<symbol id="i-shield" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></symbol>' +
    '<symbol id="i-logout" viewBox="0 0 24 24"><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></symbol>';
  var here = document.currentScript;
  here.insertAdjacentHTML('afterend',
    '<svg width="0" height="0" aria-hidden="true" style="position:absolute"><defs>' + SPRITE + '</defs></svg>');
})();
