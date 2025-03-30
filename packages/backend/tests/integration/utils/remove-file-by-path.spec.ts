import { unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';
import { removeFileByPath } from '../../../utils/remove-file-by-path';

const mockRemoveFileByPath = import.meta.jest.mocked(removeFileByPath);

const testFilePath = path.join(process.cwd(), 'test-file-to-delete.txt');

afterEach(() => {
  // Clean up: Ensure the file is deleted after each test
  if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
  }
});

/** Mock reset in this test does not work probably due to usage of unstable_mockModule */
describe('removeFileByPath', () => {
  it('Should remove file by path', async () => {
    import.meta.jest.resetModules();

    // This test purpose is to test a file is actually deleted,
    // even when I update Node it will still test this behavior
    mockRemoveFileByPath.mockImplementation(unlink);

    fs.writeFileSync(testFilePath, 'This is a test file.');

    await removeFileByPath(testFilePath);

    expect(fs.existsSync(testFilePath)).toBe(false);
  });
});
