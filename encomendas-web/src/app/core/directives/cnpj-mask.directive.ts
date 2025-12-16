import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCnpjMask]',
  standalone: true
})
export class CnpjMaskDirective {

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

    let newVal = event.replace(/\D/g, '');

    // Limita a 14 dígitos (CNPJ)
    if (newVal.length > 14) {
      newVal = newVal.substring(0, 14);
    }

    if (newVal.length === 0) {
      newVal = '';
    } else if (newVal.length <= 2) {
      newVal = newVal.replace(/^(\d{0,2})/, '$1');
    } else if (newVal.length <= 5) {
      newVal = newVal.replace(/^(\d{2})(\d{0,3})/, '$1.$2');
    } else if (newVal.length <= 8) {
      newVal = newVal.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (newVal.length <= 12) {
      newVal = newVal.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
    } else {
      newVal = newVal.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }

    this.ngControl.valueAccessor?.writeValue(newVal);
  }
}
