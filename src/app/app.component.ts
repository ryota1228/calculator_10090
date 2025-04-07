import { Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from './components/button/button.component';
import { CalculatorService } from './services/calculator.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  display = '';
  history: string[] = [];
  justEvaluated = false;
  expression: string = '';

  buttons = ['±','√','%','^','7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+','(',')','C','CE'];

  @ViewChild('inputRef') inputRef!: ElementRef<HTMLInputElement>;

  constructor(private calculator: CalculatorService) {}

  get displayView(): string {
    return this.display.replace(/\*/g, '×').replace(/\//g, '÷');
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    const key = event.key;
    if (/[\d+\-*/().^%]/.test(key)) {
      const converted = key === '*' ? '×' : key === '/' ? '÷' : key;
      this.onPress(converted);
      event.preventDefault();
    } else if (key === 'Enter') {
      this.onPress('=');
      event.preventDefault();
    } else if (key === 'Backspace') {
      this.onPress('CE');
      event.preventDefault();
    } else if (key === 'Escape') {
      this.onPress('C');
      event.preventDefault();
    }
  }

  onPress(label: string) {
    const input = this.inputRef.nativeElement;
    const start = input.selectionStart ?? this.display.length;
    const end = input.selectionEnd ?? this.display.length;

    if (label === 'C') {
      this.display = '';
      this.justEvaluated = false;
      return;
    }

    if (label === 'CE') {
      if (start !== end) {
        this.display = this.display.slice(0, start) + this.display.slice(end);
        this.setCursor(start);
      } else if (start > 0) {
        this.display = this.display.slice(0, start - 1) + this.display.slice(end);
        this.setCursor(start - 1);
      }
      return;
    }

    if (label === '±') {
      const numberRegex = /(-?\d+(\.\d+)?)(?!.*(-?\d+(\.\d+)?))/;
      const match = this.display.slice(0, start).match(numberRegex);
      if (match) {
        const numStart = this.display.lastIndexOf(match[1], start);
        const numEnd = numStart + match[1].length;
        const newVal = match[1].startsWith('-')
          ? match[1].substring(1)
          : '-' + match[1];
        this.display =
          this.display.slice(0, numStart) + newVal + this.display.slice(numEnd);
        this.setCursor(start + (newVal.length - match[1].length));
      }
      return;
    }

    if (label === '√') {
      const before = this.display.slice(0, start);
      const after = this.display.slice(end);
      if (/\d$|\)$/.test(before)) {
        this.display = before + '*√(' + after;
        this.setCursor(start + 3);
      } else {
        this.display = before + '√(' + after;
        this.setCursor(start + 2);
      }
      return;
    }

    if (label === '%') {
      if (/\d$/.test(this.display.slice(0, start))) {
        this.display = this.display.slice(0, start) + '%' + this.display.slice(end);
        this.setCursor(start + 1);
      }
      return;
    }

    if (label === '^') {
      if (/\d$|\)$/.test(this.display.slice(0, start))) {
        this.display = this.display.slice(0, start) + '^' + this.display.slice(end);
        this.setCursor(start + 1);
      }
      return;
    }

    
    if (label === ')') {
      const openCount = (this.display.match(/\(/g) || []).length;
      const closeCount = (this.display.match(/\)/g) || []).length;

      if (closeCount >= openCount) {
        if (this.display[end] === ')') {
          this.setCursor(end + 1);
        }
        return;
      }

      this.display = this.display.slice(0, start) + ')' + this.display.slice(end);
      this.setCursor(start + 1);
      return;
    }

    if (label === '=') {
      if (this.display.trim() === '') return;

      try {
        let expr = this.display;
        const openCount = (expr.match(/\(/g) || []).length;
        const closeCount = (expr.match(/\)/g) || []).length;
        const missingClose = openCount - closeCount;
        if (missingClose > 0) {
          expr += ')'.repeat(missingClose);
        }

        const evalExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
        const result = this.calculator.evaluate(evalExpr);
        const formatted = Number.isInteger(result)
          ? result.toString()
          : result.toFixed(8).replace(/\.?0+$/, '');
        this.addToHistory(`${this.displayView} = ${formatted}`);
        this.display = formatted;
        this.setCursor(this.display.length);
        this.justEvaluated = true;
      } catch {
        this.display = 'Error';
        this.setCursor(this.display.length);
      }
      return;
    }

    if (this.justEvaluated && /\d/.test(label)) {
      this.display = '';
    }
    this.justEvaluated = false;

    const converted = label === '×' ? '*' : label === '÷' ? '/' : label;
    const lastChar = this.display.at(start - 1) ?? '';
    const isOperator = (ch: string) => ['+', '-', '*', '/', '^'].includes(ch);

    if (isOperator(converted) && isOperator(lastChar)) {
      if (!(converted === '-' && lastChar !== '-')) return;
    }

    if (this.display === '' && ['+', '*', '/', '^'].includes(converted)) return;
    if (this.display === '' && converted === ')') return;

    if (converted === '.') {
      const block = this.display.slice(0, start).split(/[\+\-\*\/\^\(\)]/).at(-1) ?? '';
      if (block.includes('.')) return;
    }

    if (lastChar === '(' && ['+', '*', '/', '^'].includes(converted)) return;
    if (converted === ')' && isOperator(lastChar)) return;

    if (label === ')') {
      const currentOpen = (this.display.slice(0, start).match(/\(/g) || []).length;
      const currentClose = (this.display.slice(0, start).match(/\)/g) || []).length;
      if (currentClose >= currentOpen) {
        if (this.display.charAt(start) === ')') {
          this.setCursor(start + 1);
        }
        return;
      }
      this.display = this.display.slice(0, start) + ')' + this.display.slice(end);
      this.setCursor(start + 1);
      return;
    }

    const currentOpen = (this.display.slice(0, start).match(/\(/g) || []).length;
    const currentClose = (this.display.slice(0, start).match(/\)/g) || []).length;
    if (converted === ')' && currentClose >= currentOpen) return;

    const prev = this.display.slice(0, start);
    if (/(\D|^)\b0$/.test(prev) && /\d/.test(converted)) return;

    if (
      (/\d$/.test(lastChar) && converted === '(') ||
      (/\d$/.test(lastChar) && converted === '√') ||
      (lastChar === ')' && /\d|\(/.test(converted))
    ) {
      this.display =
        this.display.slice(0, start) + '*' + converted + this.display.slice(end);
      this.setCursor(start + 1 + converted.length);
      return;
    }

    if (converted === '(') {
      this.display = this.display.slice(0, start) + '()' + this.display.slice(end);
      this.setCursor(start + 1);
      return;
    }

    if (this.display.at(end) === ')') {
      this.display = this.display.slice(0, start) + converted + this.display.slice(end);
      this.setCursor(start + converted.length);
      return;
    }

    this.display = this.display.slice(0, start) + converted + this.display.slice(end);
    this.setCursor(start + converted.length);
  }

  useHistory(entry: string) {
    const parts = entry.split('=');
    if (parts.length === 2) {
      const expr = parts[0].trim().replace(/×/g, '*').replace(/÷/g, '/');
      this.display = expr;
      this.setCursor(expr.length);
    }
  }

  setCursor(pos: number) {
    setTimeout(() => {
      const input = this.inputRef.nativeElement;
      input.focus();
      input.setSelectionRange(pos, pos);
    });
  }

  addToHistory(entry: string) {
    this.history.unshift(entry);
    if (this.history.length > 20) {
      this.history.pop();
    }
  }
}
