import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculatorService {
  evaluate(expression: string): number {
  
    expression = expression.replace(/(\d+(?:\.\d+)?)\s*([\+\-])\s*(\d+(?:\.\d+)?)%/, (_, a, op, b) => {
      return `${a} ${op} (${b} / 100 * ${a})`;
    });
if (!/^[\d+\-*/().^%√\s]+$/.test(expression)) {
      throw new Error('Invalid characters in expression');
    }

    const result = this.parseExpression(expression.replace(/\s+/g, ''));
    if (typeof result !== 'number' || isNaN(result)) {
      throw new Error('Invalid calculation result');
    }

    return result;
  }

  private parseExpression(expr: string): number {
    const output: string[] = [];
    const ops: string[] = [];

    const prec: { [op: string]: number } = {
      '+': 1,
      '-': 1,
      '*': 2,
      '/': 2,
      '%': 2,
      '^': 3,
      '√': 4,
    };

    const assoc: { [op: string]: 'L' | 'R' } = {
      '+': 'L',
      '-': 'L',
      '*': 'L',
      '/': 'L',
      '%': 'L',
      '^': 'R',
      '√': 'R',
    };

    let i = 0;
    while (i < expr.length) {
      const ch = expr[i];

      if (/\d/.test(ch) || ch === '.') {
        let num = ch;
        while (i + 1 < expr.length && /[\d.]/.test(expr[i + 1])) {
          num += expr[++i];
        }
        output.push(num);
      } else if (ch === '(') {
        ops.push(ch);
      } else if (ch === ')') {
        while (ops.length && ops[ops.length - 1] !== '(') {
          output.push(ops.pop()!);
        }
        ops.pop();

        if (ops.length && ops[ops.length - 1] === '√') {
          output.push(ops.pop()!);
        }
      } else if (ch === '-' && (i === 0 || /[+\-*/^%√(]/.test(expr[i - 1]))) {
        
        let num = '-';
        i++;
        while (i < expr.length && /[\d.]/.test(expr[i])) {
          num += expr[i++];
        }
        output.push(num);
        i--;
      } else if (ch === '√') {
        ops.push(ch);
      } else if (prec[ch]) {
        while (
          ops.length &&
          prec[ops[ops.length - 1]] !== undefined &&
          (
            (assoc[ch] === 'L' && prec[ch] <= prec[ops[ops.length - 1]]) ||
            (assoc[ch] === 'R' && prec[ch] < prec[ops[ops.length - 1]])
          )
        ) {
          output.push(ops.pop()!);
        }
        ops.push(ch);
      }

      i++;
    }

    while (ops.length) {
      output.push(ops.pop()!);
    }

    const stack: number[] = [];
    for (const token of output) {
      if (!isNaN(Number(token))) {
        stack.push(Number(token));
      } else if (token === '√') {
        const a = stack.pop()!;
        if (a < 0) throw new Error('√ of negative number');
        stack.push(Math.sqrt(a));
      } else if (token === '%') {
        const a = stack.pop()!;
        stack.push(a / 100);
      } else {
        const b = stack.pop()!;
        const a = stack.pop()!;
        switch (token) {
          case '+': stack.push(a + b); break;
          case '-': stack.push(a - b); break;
          case '*': stack.push(a * b); break;
          case '/':
            if (b === 0) throw new Error('Divide by zero');
            stack.push(a / b);
            break;
          case '^': stack.push(Math.pow(a, b)); break;
          default: throw new Error('Unknown operator: ' + token);
        }
      }
    }

    return stack[0];
  }
}
