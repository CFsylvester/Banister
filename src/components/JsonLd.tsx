/** schema.org JSON-LD from a Server Component. `<` is escaped so a value can never close the script tag early.
 * Only describe what the page visibly shows (Google structured-data policies). */
export default function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
