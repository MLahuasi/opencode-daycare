/** Persisted comment attached to a Post. */
export type PostComment = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string | null;
};

/**
 * Checks whether a person owns a comment.
 *
 * @param comment - Comment to inspect.
 * @param personId - Person requesting the operation.
 * @returns Whether the person is the comment author.
 */
export function isCommentAuthor(
  comment: PostComment,
  personId: string,
): boolean {
  return comment.authorId === personId;
}
