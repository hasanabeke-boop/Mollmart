'use client';

import { useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { translateUiText } from "@/lib/i18n";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE"]);
const TRANSLATABLE_ATTRS = ["placeholder", "aria-label", "title"] as const;

function shouldSkip(node: Node): boolean {
  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;

  if (!element) return true;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.closest("[data-no-translate]")) return true;
  return false;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export default function AutoTranslator() {
  const { language } = useLanguage();
  const textOriginalsRef = useRef(new WeakMap<Text, string>());
  const attrOriginalsRef = useRef(new WeakMap<Element, Map<string, string>>());

  useEffect(() => {
    const textOriginals = textOriginalsRef.current;
    const attrOriginals = attrOriginalsRef.current;

    const translateTextNode = (node: Text) => {
      if (shouldSkip(node)) return;

      const normalized = normalizeText(node.nodeValue ?? "");
      if (!normalized) return;

      let original = textOriginals.get(node);
      if (original === undefined) {
        original = normalized;
        textOriginals.set(node, original);
      } else if (original !== normalized) {
        // Live UI updates (totals, counts) change text after we stored the original.
        // Treat the new value as source instead of reverting to a stale translation.
        const previousTranslation = translateUiText(original, language);
        if (normalized !== previousTranslation) {
          original = normalized;
          textOriginals.set(node, original);
        }
      }

      const translated = translateUiText(original, language);
      if (translated !== normalized) {
        node.nodeValue = (node.nodeValue ?? "").replace(normalized, translated);
      }
    };

    const translateElementAttrs = (element: Element) => {
      if (shouldSkip(element)) return;

      for (const attr of TRANSLATABLE_ATTRS) {
        const current = element.getAttribute(attr);
        if (!current) continue;

        let originals = attrOriginals.get(element);
        if (!originals) {
          originals = new Map();
          attrOriginals.set(element, originals);
        }
        if (!originals.has(attr)) {
          originals.set(attr, current);
        }

        const original = originals.get(attr) ?? current;
        const translated = translateUiText(original, language);
        if (translated !== current) {
          element.setAttribute(attr, translated);
        }
      }
    };

    const translateTree = (root: ParentNode) => {
      if (root instanceof Element) {
        translateElementAttrs(root);
      }

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      let current = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          translateTextNode(current as Text);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          translateElementAttrs(current as Element);
        }
        current = walker.nextNode();
      }
    };

    translateTree(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData" && mutation.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(mutation.target as Text);
          continue;
        }

        if (mutation.type === "attributes" && mutation.target instanceof Element) {
          translateElementAttrs(mutation.target);
          continue;
        }

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            translateTree(node as Element);
          }
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRS],
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}
