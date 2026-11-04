import { Editor } from 'ngx-editor';
import { schema as defaultSchema } from 'ngx-editor/schema';
import { Schema } from 'prosemirror-model';
import { TextSelection } from 'prosemirror-state';
import { tableEditing, tableNodes } from 'prosemirror-tables';

export const editorTableSchema = new Schema({
  nodes: defaultSchema.spec.nodes.append(
    tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {},
    }),
  ),
  marks: defaultSchema.spec.marks,
}) as any;
type EditorOptions = ConstructorParameters<typeof Editor>[0];

export function createTableEditor(options?: EditorOptions): Editor {
  return new Editor({
    ...options,
    schema: editorTableSchema,
    plugins: [...(options?.plugins ?? []), tableEditing()],
  });
}

export function insertTable(editor: Editor, rows = 3, columns = 3): void {
  const view = editor.view;

  if (!view.editable) {
    return;
  }

  const { state } = view;
  const { schema } = state;

  const tableRows = Array.from({ length: rows }, () =>
    schema.nodes['table_row'].create(
      null,
      Array.from({ length: columns }, () =>
        schema.nodes['table_cell'].create(
          null,
          schema.nodes['paragraph'].create(),
        ),
      ),
    ),
  );

  const table = schema.nodes['table'].create(null, tableRows);

  const transaction = state.tr.replaceSelectionWith(table);

  // Move the cursor into the newly inserted table.
  let insertedTablePosition: number | undefined;

  transaction.doc.descendants((node, position) => {
    if (node === table) {
      insertedTablePosition = position;
      return false;
    }

    return true;
  });

  if (insertedTablePosition !== undefined) {
    transaction.setSelection(
      TextSelection.near(transaction.doc.resolve(insertedTablePosition + 3)),
    );
  }

  view.dispatch(transaction.scrollIntoView());
  view.focus();
}
