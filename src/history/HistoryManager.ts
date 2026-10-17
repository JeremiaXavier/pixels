import { HistoryCommand } from '@/types/history';

export class HistoryManager {
  private commands: HistoryCommand[] = [];
  private currentIndex = -1;
  private maxHistory = 40;
  private listeners: Array<() => void> = [];

  public getCommands(): ReadonlyArray<HistoryCommand> {
    return this.commands;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  public canRedo(): boolean {
    return this.currentIndex < this.commands.length - 1;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public push(command: HistoryCommand): void {
    // If we performed an action while in the past, discard subsequent future actions
    if (this.currentIndex < this.commands.length - 1) {
      this.commands = this.commands.slice(0, this.currentIndex + 1);
    }

    this.commands.push(command);

    // Limit maximum history length to prevent excessive memory usage
    if (this.commands.length > this.maxHistory) {
      this.commands.shift();
    } else {
      this.currentIndex++;
    }

    this.notify();
  }

  public async undo(): Promise<void> {
    if (!this.canUndo()) return;
    const cmd = this.commands[this.currentIndex];
    this.currentIndex--;
    try {
      await cmd.undo();
    } catch (err) {
      console.error('Failed to execute undo command:', err);
    }
    this.notify();
  }

  public async redo(): Promise<void> {
    if (!this.canRedo()) return;
    this.currentIndex++;
    const cmd = this.commands[this.currentIndex];
    try {
      await cmd.redo();
    } catch (err) {
      console.error('Failed to execute redo command:', err);
    }
    this.notify();
  }

  public async jumpToIndex(targetIndex: number): Promise<void> {
    if (targetIndex < -1 || targetIndex >= this.commands.length || targetIndex === this.currentIndex) {
      return;
    }

    if (targetIndex < this.currentIndex) {
      while (this.currentIndex > targetIndex) {
        await this.undo();
      }
    } else {
      while (this.currentIndex < targetIndex) {
        await this.redo();
      }
    }
  }

  public clear(): void {
    this.commands = [];
    this.currentIndex = -1;
    this.notify();
  }
}

export const historyManager = new HistoryManager();
