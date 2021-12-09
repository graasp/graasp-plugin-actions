
// global
import { Actor, DatabaseTransactionHandler, ItemMembership, Member, MemberService } from 'graasp';
// local
import { BaseMemberTask } from './base-member-task';

export class GetMembersTask extends BaseMemberTask<Member[]> {
  get name(): string {
    return GetMembersTask.name;
  }

  private memberships: ItemMembership[];
  private memberService: MemberService;

  constructor(actor: Actor, memberships: ItemMembership[], memberService: MemberService) {
    super(actor);
    this.memberships = memberships;
    this.memberService = memberService;
  }

  async run(handler: DatabaseTransactionHandler): Promise<void> {
    this.status = 'RUNNING';

    // get member
    const members = await Promise.all(
      this.memberships.map(async (membership) => await this.memberService.get(membership.memberId, handler)),
    );

    this._result = members;
    this.status = 'OK';
  }
}