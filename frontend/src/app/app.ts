import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from './layout/nav/nav';

@Component({
  imports: [RouterOutlet, Nav],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
