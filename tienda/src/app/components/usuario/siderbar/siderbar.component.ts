import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-siderbar',
  templateUrl: './siderbar.component.html',
  styleUrl: './siderbar.component.css'
})
export class SiderbarComponent implements OnInit {

  nombres: string | null = null;
  email: string | null = null;

  constructor() {}

  ngOnInit(): void {
    this.nombres = localStorage.getItem('nombres');
    this.email = localStorage.getItem('email');

  }

}
