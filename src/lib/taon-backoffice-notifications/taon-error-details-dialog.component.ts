//#region imports
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
//#endregion

export interface TaonErrorDetailsDialogData {
  message: string;
  details: string;
}

type TaonEditor = 'vscode' | 'vscodium';

interface TaonStackTraceLine {
  text: string;
  file?: string;
  line?: number;
  column?: number;
}

@Component({
  selector: 'taon-error-details-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatButtonToggleModule],
  templateUrl: './taon-error-details-dialog.component.html',
  styleUrls: ['./taon-error-details-dialog.component.scss'],
})
export class TaonErrorDetailsDialogComponent {
  //#region injections
  readonly data = inject<TaonErrorDetailsDialogData>(MAT_DIALOG_DATA);
  //#endregion

  //#region constants
  private readonly editorStorageKey = 'taon-error-details-editor';
  //#endregion

  //#region state
  editor: TaonEditor = this.loadEditor();

  readonly stackLines = this.parseStackTrace(this.data.details);
  //#endregion

  //#region editor
  setEditor(editor: TaonEditor): void {
    this.editor = editor;

    localStorage.setItem(this.editorStorageKey, editor);
  }

  private loadEditor(): TaonEditor {
    const editor = localStorage.getItem(this.editorStorageKey);

    if (editor === 'vscode' || editor === 'vscodium') {
      return editor;
    }

    return 'vscode';
  }
  //#endregion

  //#region stack trace
  private parseStackTrace(stack: string): TaonStackTraceLine[] {
    return stack
      .split('\n')
      .map(text => text.trimEnd())
      .filter(text => text.trim().length > 0)
      .map(text => this.parseStackTraceLine(text));
  }

  private parseStackTraceLine(text: string): TaonStackTraceLine {
    /**
     * Matches:
     *
     * /Users/test/file.ts:10:20
     *
     * C:\projects\test\file.ts:10:20
     *
     * at something (/Users/test/file.ts:10:20)
     */
    const match = text.match(/((?:[A-Za-z]:[\\/]|\/)[^()\n]+?):(\d+):(\d+)/);

    if (!match) {
      return {
        text,
      };
    }

    return {
      text,
      file: match[1],
      line: Number(match[2]),
      column: Number(match[3]),
    };
  }
  //#endregion

  //#region open editor
  openStackLine(stackLine: TaonStackTraceLine): void {
    if (!stackLine.file || !stackLine.line) {
      return;
    }

    const url = this.createEditorUrl(
      stackLine.file,
      stackLine.line,
      stackLine.column,
    );

    window.location.href = url;
  }

  private createEditorUrl(file: string, line: number, column?: number): string {
    const protocol = this.editor === 'vscodium' ? 'vscodium' : 'vscode';

    const location = [file, line, column]
      .filter(value => value !== undefined)
      .join(':');

    return `${protocol}://file${location}`;
  }
  //#endregion
}
