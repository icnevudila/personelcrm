export default function AiTitleGeneratorTab({ projectId, projectName }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">AI Title Generator</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {projectName} projesi için AI destekli başlık önerileri burada olacak.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-200 p-10 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">AI Title Generator yakında eklenecek.</p>
      </div>
    </div>
  );
}
