'use client';

import {
  EditorContent,
  useEditor,
} from '@tiptap/react';

import StarterKit
  from '@tiptap/starter-kit';

type Props = {
  content: string;

  onChange: (
    value: string
  ) => void;
};

export default function RichTextEditor({
  content,
  onChange,
}: Props) {
  const editor = useEditor({
    extensions: [StarterKit],

    content,

    editorProps: {
      attributes: {
        class:
          'min-h-[200px] border rounded-lg p-4 focus:outline-none',
      },
    },

    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBold()
              .run()
          }
          className="border px-3 py-1 rounded"
        >
          Bold
        </button>

        <button
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleItalic()
              .run()
          }
          className="border px-3 py-1 rounded"
        >
          Italic
        </button>

        <button
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleBulletList()
              .run()
          }
          className="border px-3 py-1 rounded"
        >
          Bullet List
        </button>

        <button
          onClick={() =>
            editor
              ?.chain()
              .focus()
              .toggleHeading({
                level: 2,
              })
              .run()
          }
          className="border px-3 py-1 rounded"
        >
          H2
        </button>
      </div>

      {/* Editor */}

      <EditorContent editor={editor} />
    </div>
  );
}