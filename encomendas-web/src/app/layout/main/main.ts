import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'; //
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    RouterOutlet,
    MatSidenavModule,
    Navbar,
    Sidebar
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss'
})
export class Main implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  public isMobile = false;
  private layoutSub: Subscription | undefined;
  private routerSub: Subscription | undefined;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Detecta mudança de tamanho de tela (Mobile vs Desktop)
    this.layoutSub = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).subscribe(result => {
      this.isMobile = result.matches;
      if (this.isMobile) {
        // Se for mobile, fecha o menu inicialmente
        this.sidenav?.close();
      } else {
        // Se for desktop, mantém aberto e fixo
        this.sidenav?.open();
      }
    });

    // 2. Fecha o menu automaticamente ao navegar em mobile
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.isMobile) {
        this.sidenav.close();
      }
    });
  }

  ngOnDestroy(): void {
    this.layoutSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  toggleSidenav(): void {
    this.sidenav.toggle();
  }
}
