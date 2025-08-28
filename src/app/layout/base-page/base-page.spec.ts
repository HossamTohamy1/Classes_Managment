import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasePage } from './base-page';

describe('BasePage', () => {
  let component: BasePage;
  let fixture: ComponentFixture<BasePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasePage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
