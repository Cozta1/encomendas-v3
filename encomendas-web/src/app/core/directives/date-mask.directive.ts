import { Directive, HostListener, ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appDateMask]',
  standalone: true
})
export class DateMaskDirective {

  constructor(private el: ElementRef, private control: NgControl) {}

  @HostListener('input', ['$event'])
  onInputChange(event: any) {
    const input = this.el.nativeElement;

    // 1. Limpa tudo que não for número
    let cleaned = input.value.replace(/\D/g, '');

    // 2. Limita a 8 dígitos (o que dará exatamente 10 chars com as barras)
    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }

    // 3. Monta a máscara DD/MM/AAAA
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2);
    }
    if (cleaned.length > 4) {
      formatted = cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4) + '/' + cleaned.substring(4);
    }

    // 4. Aplica o valor formatado no input visual
    input.value = formatted;

    // 5. Atualiza o FormControl (Angular) com o valor formatado (ex: "25/12/2024")
    // 'emitEvent: false' evita loops infinitos se houver subscribers
    if (this.control && this.control.control) {
      this.control.control.setValue(formatted, { emitEvent: false, emitModelToViewChange: false });
    }
  }
}
