import { Component, OnInit } from '@angular/core';
import { Products } from 'src/app/db/Products';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  products = Object.values(Products);
  constructor() {


  }

  ngOnInit(): void {
  }

}
