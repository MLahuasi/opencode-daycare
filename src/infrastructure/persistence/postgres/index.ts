import "server-only";

export type { PostgresClient, PostgresQueryClient } from "./client/postgres-client";
export type { Database, Enums, Json, Tables } from "./types";
export { createPostgresClient } from "./client/postgres-client";
export {
  PostgresClientProvider,
} from "./client/postgres-client-provider";
export {
  CurrentDaycareNotFoundError,
  CurrentDaycareProvider,
  MultipleCurrentDaycaresError,
} from "./current-daycare-provider";
export {
  RemoteDbTestsDisabledError,
  withRemoteDbTestTransaction,
} from "./transactions/remote-db-test-context";
export { runRemoteAuthPersistenceTests } from "./transactions/remote-auth-tests";
export { PostgresCredentialRepository } from "./repositories/credential-repository";
export { PostgresInvitationRepository } from "./repositories/invitation-repository";
export { PostgresAuthTransactionRunner } from "./transactions/auth-transaction-runner";
export { PostgresParentKidRepository } from "./repositories/parent-kid-repository";
export { PostgresKidRepository } from "./repositories/kid-repository";
export { PostgresPersonRepository } from "./repositories/person-repository";
export {
  PostgresPostAccessRepository,
  PostgresStaffAccessRepository,
} from "./repositories/post-access-repository";
export { PostgresRoomRepository } from "./repositories/room-repository";
export type { FeedRelations, StaffRoom } from "./mappers";
export {
  mapCredentialRow,
  mapFeedCommentRow,
  mapFeedMediaRow,
  mapFeedReactionRow,
  mapFeedRow,
  mapInvitationRow,
  mapKidRow,
  mapParentKidRow,
  mapPersonRow,
  mapRoomRow,
  mapStaffRoomRow,
} from "./mappers";
