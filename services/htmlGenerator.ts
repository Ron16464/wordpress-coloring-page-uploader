import { ProcessedImage } from '../types';

interface FormData {
  postTitle: string;
  article: string;
  faq: string;
}

const parseFaqs = (faqContent: string) => {
  const faqs = [];
  const lines = faqContent.split('\n').filter(line => line.trim() !== '');
  let currentQ = '';
  for (const line of lines) {
    if (line.toUpperCase().startsWith('Q:')) {
      if (currentQ) { // In case of Q without A
         faqs.push({ question: currentQ, answer: '' });
      }
      currentQ = line.substring(2).trim();
    } else if (line.toUpperCase().startsWith('A:')) {
      if (currentQ) {
        faqs.push({ question: currentQ, answer: line.substring(2).trim() });
        currentQ = '';
      }
    }
  }
  if (currentQ) { // Handle last Q if it has no A
    faqs.push({ question: currentQ, answer: '' });
  }
  return faqs;
};

const generateFaqSchema = (faqs: { question: string, answer: string }[]) => {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
};

const generateFaqAccordionHtml = (faqs: { question: string, answer: string }[]) => {
  if (faqs.length === 0) return '';
  
  const accordionItems = faqs.map((faq, index) => `
    <div class="faq-item" style="border-bottom: 1px solid #e2e8f0; margin-bottom: 1rem;">
      <details>
        <summary style="font-size: 1.125rem; font-weight: 600; cursor: pointer; padding: 1rem 0; list-style: none;">
          ${faq.question}
        </summary>
        <div class="faq-answer" style="padding-bottom: 1rem; color: #4a5568;">
          <p>${faq.answer}</p>
        </div>
      </details>
    </div>
  `).join('');

  return `
    <div class="faq-accordion">
      <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 1rem;">Frequently Asked Questions</h2>
      ${accordionItems}
    </div>
  `;
};

const generateGalleryHtml = (mediaIds: number[]) => {
  if (mediaIds.length === 0) return '';
  const idsString = mediaIds.join(',');

  // Using the modern blocks syntax for a gallery.
  // WordPress will automatically generate the inner image blocks from this.
  return `<!-- wp:gallery {"ids":[${idsString}],"linkTo":"media"} -->`;
};


export const generatePostHtml = (formData: FormData, mediaIds: number[]): string => {
  const articleHtml = `<!-- wp:paragraph -->\n<p>${formData.article.replace(/\n/g, '</p>\n<p>')}</p>\n<!-- /wp:paragraph -->`;
  
  const galleryHtml = generateGalleryHtml(mediaIds);
  
  const faqs = parseFaqs(formData.faq);
  const faqSchema = generateFaqSchema(faqs);
  const faqAccordionHtml = `<!-- wp:html -->\n${generateFaqAccordionHtml(faqs)}\n<!-- /wp:html -->`;

  return [faqSchema, articleHtml, galleryHtml, formData.faq ? faqAccordionHtml : ''].join('\n\n');
};
