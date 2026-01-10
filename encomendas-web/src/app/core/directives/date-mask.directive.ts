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
    let valor = input.value;

    // Remove tudo que não é dígito
    valor = valor.replace(/\D/g, '');

    // Limita tamanho
    if (valor.length > 8) {
      valor = valor.substring(0, 8);
    }

    // Aplica a máscara DD/MM/AAAA
    if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d)/, '$1/$2');
    }
    if (valor.length > 5) {
      valor = valor.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    }

    // Atualiza o valor no input visual
    input.value = valor;

    // Atualiza o FormControl sem emitir novo evento para evitar loop com o Datepicker
    if (this.control && this.control.control) {
      this.control.control.setValue(valor, { emitEvent: false, emitModelToViewChange: false });
    }
  }
}
