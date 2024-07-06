import AbstractComponent from './AbstractComponent';

export default class Comments extends AbstractComponent {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    this.newCommentForm = page.getByTestId('new-comment-form');
    this.newCommentFormEditor = page.getByTestId('new-comment-form-editor');
    this.newCommentFormInput = page.getByTestId(
      'new-comment-form-editor-input',
    );
  }

  getCommentById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-body`);
  }

  getCommentDateById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-date`);
  }

  getCommentReplyTogglerById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-toggle-reply`);
  }

  getUpvoteBtnById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-upvote`);
  }

  getDownvoteBtnById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-downvote`);
  }

  getEditBtnById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-edit`);
  }

  getDeleteBtnById(commentId = '') {
    return this.page.getByTestId(`comment-${commentId}-delete`);
  }

  getCommentReplyInput() {
    return this.page.getByTestId('comment-reply-input');
  }

  getCommentEditInput() {
    return this.page.getByTestId('comment-edit-input');
  }

  async getIsCommentByIdUpvoted(commentId = '') {
    const commentClass =
      await this.getUpvoteBtnById(commentId).getAttribute('class');

    return /upvote-btn--active/.test(commentClass);
  }

  async getIsCommentByIdDownvoted(commentId = '') {
    const commentClass =
      await this.getDownvoteBtnById(commentId).getAttribute('class');

    return /downvote-btn--active/.test(commentClass);
  }

  async toggleRepliesExpanderById(commentId = '') {
    await this.page.getByTestId(`comment-${commentId}-expander`).click();
  }

  async submitNewComment() {
    await this.page.getByTestId('new-comment-button').click();
  }

  async clickCommentReplyTogglerById(commentId = '') {
    await this.getCommentReplyTogglerById(commentId).click();
  }

  async fillCommentReplyInput(text = '') {
    await this.getCommentReplyInput().fill(text);
  }

  async submitCommentReply() {
    await this.page.getByTestId('comment-reply-btn').click();
  }

  async closeCommentReplyForm() {
    await this.page.getByTestId('comment-reply-close-btn').click();
  }

  async upvoteCommentById(commentId = '') {
    await this.getUpvoteBtnById(commentId).click();
  }

  async downvoteCommentById(commentId = '') {
    await this.getDownvoteBtnById(commentId).click();
  }

  async deleteCommentById(commentId = '') {
    await this.getDeleteBtnById(commentId).click();
  }

  async toggleCommentEditById(commentId = '') {
    await this.getEditBtnById(commentId).click();
  }

  async submitEditedComment() {
    await this.page.getByTestId('comment-edit-btn').click();
  }
}
