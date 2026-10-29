import { type BrowserContext, type Locator, type Page } from '@playwright/test';
import AbstractComponent from './AbstractComponent';
import ConfirmModal from './ConfirmModal';

export default class Post extends AbstractComponent {
  readonly context: BrowserContext;
  readonly postsList: Locator;
  readonly editBtn: Locator;
  readonly deleteBtn: Locator;
  readonly deleteConfirmModal: ConfirmModal;

  constructor(page: Page) {
    super(page);

    this.context = page.context();

    this.postsList = page.getByTestId('posts-container');
    this.editBtn = page.getByTestId('post-edit-button');
    this.deleteBtn = page.getByTestId('post-delete-button');
    this.deleteConfirmModal = new ConfirmModal(
      page,
      'confirm-delete-post-modal',
    );
  }

  setPage(page: Page) {
    this.page = page;
  }

  getRatingById(id = '') {
    return this.page.getByTestId(`post-${id}-rating`);
  }

  getTitleById(id: string) {
    return this.page.getByTestId(`post-${id}-title`);
  }

  getPostById(id: string) {
    return this.page.locator(`[data-post-id="${id}"]`);
  }

  getListedPosts() {
    return this.postsList.locator('[data-post-id]');
  }

  /** Leaves the post `offset` px below the top of the window, where a click
   * on its title needs no scrolling first */
  async scrollPostDownTo(id: string, offset: number) {
    await this.getPostById(id).evaluate((post, by) => {
      post.scrollIntoView();
      window.scrollBy(0, -by);
    }, offset);
  }

  async getPostTopById(id: string) {
    return (await this.getPostById(id).boundingBox())?.y;
  }

  async scrollToListEnd() {
    await this.page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight),
    );
  }

  getCommentsCountById(id = '') {
    return this.page.getByTestId(`post-${id}-comments-count`);
  }

  getUpvoteBtnById(postId = '') {
    return this.page.getByTestId(`post-${postId}-upvote`);
  }

  getDownvoteBtnById(postId = '') {
    return this.page.getByTestId(`post-${postId}-downvote`);
  }

  getFollowTagBtn() {
    return this.findContextMenuOption('Follow tag');
  }

  getUnfollowTagBtn() {
    return this.findContextMenuOption('Unfollow tag');
  }

  getSearchTagBtn() {
    return this.findContextMenuOption('Search tag');
  }

  getNoContentText() {
    return this.page.getByTestId('no-content');
  }

  getNoMoreContentText() {
    return this.page.getByTestId('no-more-content');
  }

  getTextSectionByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-text-${hash}`);
  }

  getPicSectionByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-pic-${hash}`);
  }

  getVideoSectionByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-vid-${hash}`);
  }

  getSpoilerVeilByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-spoiler-${hash}`);
  }

  async revealSpoilerByHash(postId = '', hash = '') {
    await this.getSpoilerVeilByHash(postId, hash).click();
  }

  async getIsPostByIdUpvoted(postId = '') {
    return (
      (await this.getUpvoteBtnById(postId).getAttribute('aria-pressed')) ===
      'true'
    );
  }

  async getIsPostByIdDownvoted(postId = '') {
    return (
      (await this.getDownvoteBtnById(postId).getAttribute('aria-pressed')) ===
      'true'
    );
  }

  getTag(postId = '', tag = '') {
    return this.page.getByTestId(`post-${postId}-tag-${tag}`);
  }

  async clickTag(postId = '', tag = '') {
    await this.getTag(postId, tag).click();
  }

  async followTag(postId = '', tag = '') {
    await this.clickTag(postId, tag);
    await this.getFollowTagBtn().click();
  }

  async unfollowTag(postId = '', tag = '') {
    await this.clickTag(postId, tag);
    await this.getUnfollowTagBtn().click();
  }

  async searchTag(postId = '', tag = '') {
    await this.clickTag(postId, tag);
    await this.getSearchTagBtn().click();
  }

  async openPostById(id: string) {
    await this.getTitleById(id).click();
  }

  /** Returns the tab a middle click on the post's title opens */
  async openPostByIdInNewTab(postId: string) {
    const [newPage] = await Promise.all([
      this.context.waitForEvent('page'),
      this.getTitleById(postId).click({ button: 'middle' }),
    ]);

    return newPage;
  }

  async openPostAuthorProfile(postId: string) {
    this.page.getByTestId(`post-${postId}-author`).click();
  }

  async startEditingPost() {
    await this.editBtn.click();
  }

  async deletePost() {
    await this.deleteBtn.click();
    await this.deleteConfirmModal.confirm();
  }

  async upvotePostById(postId = '') {
    await this.getUpvoteBtnById(postId).click();
  }

  async downvotePostById(postId = '') {
    await this.getDownvoteBtnById(postId).click();
  }
}
