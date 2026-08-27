(() => {
  const INTERACTIVE = 'button, a, input, select, textarea, label, [role="button"]';
  const THUMB_WINDOW_SIZE = 5;
  const INITIAL_REAL_THUMBS = 4;
  const MOBILE_THUMBS_QUERY = '(max-width: 749px)';

  function enhanceGallery(gallery) {
    if (!gallery || gallery.dataset.moruPolished === 'true') return;
    gallery.dataset.moruPolished = 'true';

    const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-thumb]'));
    const thumbItems = thumbs.map((thumb) => thumb.closest('li') || thumb.parentElement);
    const thumbList = gallery.querySelector('.moru-product__thumbs');
    const stage = gallery.querySelector('.moru-product__stage');
    const prev = gallery.querySelector('[data-gallery-prev]');
    const next = gallery.querySelector('[data-gallery-next]');
    const mobileThumbs = window.matchMedia(MOBILE_THUMBS_QUERY);

    if (thumbs.length > THUMB_WINDOW_SIZE && thumbList) {
      let expanded = false;
      const fourthItem = thumbItems[INITIAL_REAL_THUMBS - 1];
      const moreItem = document.createElement('li');
      moreItem.className = 'moru-product__thumb-more';

      const moreButton = document.createElement('button');
      moreButton.type = 'button';
      moreButton.className = 'moru-product__thumb-more-btn';
      moreButton.setAttribute('aria-label', `他の${thumbs.length - INITIAL_REAL_THUMBS}枚の画像を見る`);

      const mosaic = document.createElement('span');
      mosaic.className = 'moru-product__thumb-more-grid';
      mosaic.setAttribute('aria-hidden', 'true');

      thumbs.slice(INITIAL_REAL_THUMBS, INITIAL_REAL_THUMBS + 4).forEach((thumb) => {
        const source = thumb.querySelector('img, svg');
        if (!source) return;
        const cell = document.createElement('span');
        cell.className = 'moru-product__thumb-more-cell';
        const clone = source.cloneNode(true);
        if (clone.tagName === 'IMG') clone.alt = '';
        clone.setAttribute('aria-hidden', 'true');
        cell.appendChild(clone);
        mosaic.appendChild(cell);
      });

      const plus = document.createElement('span');
      plus.className = 'moru-product__thumb-more-plus';
      plus.setAttribute('aria-hidden', 'true');
      plus.textContent = '+';

      moreButton.appendChild(mosaic);
      moreButton.appendChild(plus);
      moreItem.appendChild(moreButton);
      if (fourthItem) fourthItem.insertAdjacentElement('afterend', moreItem);

      const getActiveIndex = () => {
        if (Number.isInteger(gallery.index)) return gallery.index;
        const found = thumbs.findIndex((thumb) => thumb.classList.contains('is-active'));
        return found >= 0 ? found : 0;
      };

      const setVisible = (item, visible) => {
        if (item) item.hidden = !visible;
      };

      const scrollThumbIntoView = (index, behavior = 'smooth') => {
        if (!mobileThumbs.matches || !thumbList || !thumbItems[index]) return;
        const item = thumbItems[index];
        const target = Math.max(0, item.offsetLeft - (thumbList.clientWidth - item.offsetWidth) / 2);
        thumbList.scrollTo({ left: target, behavior });
      };

      const renderThumbWindow = (requestedIndex, behavior = 'smooth') => {
        const activeIndex = Number.isInteger(requestedIndex) ? requestedIndex : getActiveIndex();

        if (mobileThumbs.matches) {
          thumbItems.forEach((item) => setVisible(item, true));
          moreItem.hidden = expanded;
          scrollThumbIntoView(activeIndex, behavior);
          return;
        }

        if (!expanded && activeIndex < INITIAL_REAL_THUMBS) {
          thumbItems.forEach((item, index) => setVisible(item, index < INITIAL_REAL_THUMBS));
          moreItem.hidden = false;
          return;
        }

        expanded = true;
        moreItem.hidden = true;

        const maxStart = Math.max(0, thumbs.length - THUMB_WINDOW_SIZE);
        const windowStart = Math.min(Math.max(activeIndex - 2, 0), maxStart);
        const windowEnd = windowStart + THUMB_WINDOW_SIZE;
        thumbItems.forEach((item, index) => setVisible(item, index >= windowStart && index < windowEnd));
      };

      if (typeof gallery.select === 'function' && gallery.dataset.moruSelectWrapped !== 'true') {
        const originalSelect = gallery.select.bind(gallery);
        gallery.select = (index) => {
          const total = thumbs.length;
          const normalizedIndex = total ? (index + total) % total : 0;
          if (normalizedIndex >= INITIAL_REAL_THUMBS) expanded = true;
          originalSelect(index);
          window.requestAnimationFrame(() => renderThumbWindow(normalizedIndex));
        };
        gallery.dataset.moruSelectWrapped = 'true';
      }

      moreButton.addEventListener('click', () => {
        expanded = true;
        if (typeof gallery.select === 'function') gallery.select(INITIAL_REAL_THUMBS);
        else if (thumbs[INITIAL_REAL_THUMBS]) thumbs[INITIAL_REAL_THUMBS].click();
        renderThumbWindow(INITIAL_REAL_THUMBS);
      });

      thumbs.forEach((thumb, index) => {
        thumb.addEventListener('click', () => {
          if (index >= INITIAL_REAL_THUMBS) expanded = true;
          window.requestAnimationFrame(() => renderThumbWindow(index));
        });
      });

      const onBreakpointChange = () => renderThumbWindow(getActiveIndex(), 'auto');
      if (typeof mobileThumbs.addEventListener === 'function') mobileThumbs.addEventListener('change', onBreakpointChange);
      else if (typeof mobileThumbs.addListener === 'function') mobileThumbs.addListener(onBreakpointChange);

      renderThumbWindow(getActiveIndex(), 'auto');
    }

    if (stage && prev && next && stage.dataset.moruSwipeReady !== 'true') {
      stage.dataset.moruSwipeReady = 'true';
      let startX = 0;
      let startY = 0;

      stage.addEventListener('touchstart', (event) => {
        if (event.target.closest && event.target.closest(INTERACTIVE)) return;
        const touch = event.changedTouches[0];
        startX = touch.clientX;
        startY = touch.clientY;
      }, { passive: true });

      stage.addEventListener('touchend', (event) => {
        if (event.target.closest && event.target.closest(INTERACTIVE)) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
        if (dx < 0) next.click();
        else prev.click();
      }, { passive: true });
    }
  }

  function labelLongVariantValues(root = document) {
    if (!root.querySelectorAll) return;
    root.querySelectorAll('.moru-option:not(.moru-option--swatch) .moru-option__pill').forEach((pill) => {
      const label = pill.textContent.trim();
      if (label) pill.title = label;
    });
  }

  function init(root = document) {
    if (root.matches && root.matches('moru-product-gallery')) enhanceGallery(root);
    if (root.querySelectorAll) root.querySelectorAll('moru-product-gallery').forEach(enhanceGallery);
    labelLongVariantValues(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
  } else {
    init(document);
  }

  document.addEventListener('shopify:section:load', (event) => init(event.target));
})();
