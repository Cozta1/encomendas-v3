import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCpfMask]',
  standalone: true
})
export class CpfMaskDirective {

  constructor(public ngControl: NgControl) { }

  @HostListener('ngModelChange', ['$event'])
  onModelChange(event: any) {
    this.onInputChange(event, false);
  }

  @HostListener('keydown.backspace', ['$event'])
  keydownBackspace(event: any) {
    this.onInputChange(event.target.value, true);
  }

  onInputChange(event: any, backspace: boolean) {
    if (!event) return;

    // 1. Remove tudo que não é número
    let newVal = event.replace(/\D/g, '');

    // 2. Limita a 11 dígitos (CPF)
    if (newVal.length > 11) {
      newVal = newVal.substring(0, 11);
    }

    // 3. Aplica a máscara progressiva
    if (newVal.length === 0) {
      newVal = '';
    } else if (newVal.length <= 3) {
      newVal = newVal.replace(/^(\d{0,3})/, '$1');
    } else if (newVal.length <= 6) {
      newVal = newVal.replace(/^(\d{3})(\d{0,3})/, '$1.$2');
    } else if (newVal.length <= 9) {
      newVal = newVal.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else {
      newVal = newVal.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    }

    this.ngControl.valueAccessor?.writeValue(newVal);
  }
}
