import AbstractComponent from './AbstractComponent';

export default class Post extends AbstractComponent {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {boolean} isMobile
   */
  constructor(page, isMobile) {
    super(page);
    this.context = page.context();
    this.isMobile = isMobile;

    this.postsList = page.getByTestId('posts-container');

    this.editBtn = page.getByTestId('post-edit-icon');
    this.deleteBtn = page.getByTestId('post-delete-icon');
  }

  /** @param {import('@playwright/test').Page} page */
  setPage(page) {
    this.page = page;
  }

  getTitleById(id) {
    return this.page.getByTestId(`post-${id}-title`);
  }

  getUpvoteBtnById(postId = '') {
    const selector = this.isMobile
      ? `m-post-${postId}-upvote`
      : `post-${postId}-upvote`;

    return this.page.getByTestId(selector);
  }

  getDownvoteBtnById(postId = '') {
    const selector = this.isMobile
      ? `m-post-${postId}-downvote`
      : `post-${postId}-downvote`;

    return this.page.getByTestId(selector);
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

  getTextSectionByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-text-${hash}`);
  }

  getPicSectionByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-pic-${hash}`);
  }

  getVideoSectionByHash(postId = '', hash = '') {
    return this.page.getByTestId(`post-${postId}-vid-${hash}`);
  }

  async getIsPostByIdUpvoted(postId = '') {
    const postClass = await this.getUpvoteBtnById(postId).getAttribute('class');

    return /upvote--active/.test(postClass);
  }

  async getIsPostByIdDownvoted(postId = '') {
    const postClass =
      await this.getDownvoteBtnById(postId).getAttribute('class');

    return /downvote--active/.test(postClass);
  }

  async clickTag(postId = '', tag = '') {
    await this.page.getByTestId(`post-${postId}-tag-${tag}`).click();
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

  async openPostById(id) {
    await this.getByTestId(id).click();
  }

  /** On Desktop a post's page opens in a new browser tab.
   * This method returns that new tab fixture after clicking on the title by post.id */
  async openPostByIdInNewTab(postId) {
    const [newPage] = await Promise.all([
      this.context.waitForEvent('page'),
      this.getTitleById(postId).click(),
    ]);

    return newPage;
  }

  async openPostAuthorProfile(postId) {
    this.page.getByTestId(`post-${postId}-author`).click();
  }

  async startEditingPost() {
    await this.editBtn.click();
  }

  async deletePost() {
    await this.deleteBtn.click();
  }

  async upvotePostById(postId = '') {
    await this.getUpvoteBtnById(postId).click();
  }

  async downvotePostById(postId = '') {
    await this.getDownvoteBtnById(postId).click();
  }
}
