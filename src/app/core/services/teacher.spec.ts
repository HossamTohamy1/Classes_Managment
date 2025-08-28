import { TestBed } from '@angular/core/testing';
import { TeacherService } from './teacher';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TeacherService', () => {
  let service: TeacherService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeacherService]
    });
    service = TestBed.inject(TeacherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
