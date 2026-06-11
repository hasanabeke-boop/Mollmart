"use client";

import LegalDocumentPage from "@/components/legal/LegalDocumentPage";
import { useLanguage } from "@/context/LanguageContext";
import { getPrivacyDocument, legalUiLabels } from "@/lib/legalContent";

export default function PrivacyPage() {
  const { language } = useLanguage();
  const document = getPrivacyDocument(language);
  const labels = legalUiLabels[language] ?? legalUiLabels.en;

  return <LegalDocumentPage document={document} labels={labels} />;
}
