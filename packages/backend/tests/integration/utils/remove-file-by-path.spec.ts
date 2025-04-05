import path from 'path';
import fs from 'fs';
import { removeFileByPath } from '../../../src/utils/remove-file-by-path';

const testFilePath = path.join(process.cwd(), 'test-file-to-delete.txt');

afterEach(() => {
  // Clean up: Ensure the file is deleted after each test
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
});

describe('removeFileByPath', () => {
  // This test purpose is to test a file is actually deleted,
  // even when I update Node it will still test this behavior
  it('Should remove file by path', async () => {
    fs.writeFileSync(testFilePath, 'This is a test file.');

    await removeFileByPath(testFilePath);

    expect(fs.existsSync(testFilePath)).toBe(false);
  });
});
