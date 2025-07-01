import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { NavComponent } from './components/nav/nav.component';
import { TerminalComponent } from './components/terminal/terminal.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, NavComponent, TerminalComponent, FooterComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ForgeRedTerminal';
  @ViewChild('terminal') terminal!: TerminalComponent;

  onCommandSelected(command: string) {
    if (this.terminal) {
      this.terminal.executeCommand(command);
    }
  }
}