import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appCepMask]',
  standalone: true
})
export class CepMaskDirective {

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

    // 2. Limita a 8 dígitos (tamanho do CEP)
    if (newVal.length > 8) {
      newVal = newVal.substring(0, 8);
    }

    if (newVal.length === 0) {
      newVal = '';
    } else if (newVal.length <= 5) {
      newVal = newVal.replace(/^(\d{0,5})/, '$1');
    } else {
      // Formata XXXXX-XXX
      newVal = newVal.replace(/^(\d{5})(\d{0,3})/, '$1-$2');
    }

    this.ngControl.valueAccessor?.writeValue(newVal);
  }
}
