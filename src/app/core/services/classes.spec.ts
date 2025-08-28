import { TestBed } from '@angular/core/testing';
import { ClassesService } from './classes';

describe('ClassesService', () => {
  let service: ClassesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClassesService]
    });
    service = TestBed.inject(ClassesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
