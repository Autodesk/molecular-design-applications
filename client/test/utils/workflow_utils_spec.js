import { expect } from 'chai';
import { List as IList } from 'immutable';
import WorkflowRecord from '../../public/js/records/workflow_record';
import WorkflowNodeRecord from '../../public/js/records/workflow_node_record';
import statusConstants from '../../../shared/status_constants';
import workflowUtils from '../../public/js/utils/workflow_utils';

describe('workflowUtils', () => {
  let workflow;

  beforeEach(() => {
    workflow = new WorkflowRecord({
      pdbUrl: 'https://s3-us-west-1.amazonaws.com/adsk-dev/3AID.pdb',
      email: 'justin.mccandless@autodesk.com',
    });
  });

  describe('isRunnable', () => {
    describe('when no pdbUrl', () => {
      beforeEach(() => {
        workflow = workflow.set('pdbUrl', '');
      });

      it('returns false', () => {
        expect(workflowUtils.isRunnable(workflow)).to.equal(false);
      });
    });

    describe('when no email', () => {
      beforeEach(() => {
        workflow = workflow.set('email', '');
      });

      it('returns false', () => {
        expect(workflowUtils.isRunnable(workflow)).to.equal(false);
      });
    });

    describe('when email and pdbUrl', () => {
      it('returns true', () => {
        expect(workflowUtils.isRunnable(workflow)).to.equal(true);
      });
    });
  });

  describe('getWorkflowStatus', () => {
    let workflowNodes;

    beforeEach(() => {
      workflowNodes = new IList([
        new WorkflowNodeRecord({
          status: statusConstants.IDLE,
        }),
        new WorkflowNodeRecord({
          status: statusConstants.IDLE,
        }),
        new WorkflowNodeRecord({
          status: statusConstants.IDLE,
        }),
      ]);
    });

    describe('when given no workflowNodes', () => {
      it('returns idle', () => {
        const status = workflowUtils.getWorkflowStatus(new IList());
        expect(status).to.equal(statusConstants.IDLE);
      });
    });

    describe('when there is an error anywhere in the nodes', () => {
      let workflowNodesBeg;
      let workflowNodesMid;
      let workflowNodesEnd;
      let workflowNodesAll;

      beforeEach(() => {
        workflowNodesBeg = workflowNodes.insert(0, new WorkflowNodeRecord({
          status: statusConstants.ERROR,
        }));
        workflowNodesMid = workflowNodes.insert(1, new WorkflowNodeRecord({
          status: statusConstants.ERROR,
        }));
        workflowNodesEnd = workflowNodes.push(new WorkflowNodeRecord({
          status: statusConstants.ERROR,
        }));
        workflowNodesAll = new IList([new WorkflowNodeRecord({
          status: statusConstants.ERROR,
        })]);
      });

      it('returns error', () => {
        const statusBeg = workflowUtils.getWorkflowStatus(workflowNodesBeg);
        const statusMid = workflowUtils.getWorkflowStatus(workflowNodesMid);
        const statusEnd = workflowUtils.getWorkflowStatus(workflowNodesEnd);
        const statusAll = workflowUtils.getWorkflowStatus(workflowNodesAll);
        expect(statusBeg).to.equal(statusConstants.ERROR);
        expect(statusMid).to.equal(statusConstants.ERROR);
        expect(statusEnd).to.equal(statusConstants.ERROR);
        expect(statusAll).to.equal(statusConstants.ERROR);
      });
    });

    describe('when there is a canceled anywhere in the nodes', () => {
      let workflowNodesBeg;
      let workflowNodesMid;
      let workflowNodesEnd;
      let workflowNodesAll;

      beforeEach(() => {
        workflowNodesBeg = workflowNodes.insert(0, new WorkflowNodeRecord({
          status: statusConstants.CANCELED,
        }));
        workflowNodesMid = workflowNodes.insert(1, new WorkflowNodeRecord({
          status: statusConstants.CANCELED,
        }));
        workflowNodesEnd = workflowNodes.push(new WorkflowNodeRecord({
          status: statusConstants.CANCELED,
        }));
        workflowNodesAll = new IList([new WorkflowNodeRecord({
          status: statusConstants.CANCELED,
        })]);
      });

      it('returns canceled', () => {
        const statusBeg = workflowUtils.getWorkflowStatus(workflowNodesBeg);
        const statusMid = workflowUtils.getWorkflowStatus(workflowNodesMid);
        const statusEnd = workflowUtils.getWorkflowStatus(workflowNodesEnd);
        const statusAll = workflowUtils.getWorkflowStatus(workflowNodesAll);
        expect(statusBeg).to.equal(statusConstants.CANCELED);
        expect(statusMid).to.equal(statusConstants.CANCELED);
        expect(statusEnd).to.equal(statusConstants.CANCELED);
        expect(statusAll).to.equal(statusConstants.CANCELED);
      });
    });

    describe('when every node is completed', () => {
      beforeEach(() => {
        workflowNodes = workflowNodes.map(workflowNode =>
          workflowNode.set('status', statusConstants.COMPLETED)
        );
      });

      it('returns completed', () => {
        const status = workflowUtils.getWorkflowStatus(workflowNodes);
        expect(status).to.equal(statusConstants.COMPLETED);
      });
    });

    describe('when every node is idle', () => {
      beforeEach(() => {
        workflowNodes = workflowNodes.map(workflowNode =>
          workflowNode.set('status', statusConstants.IDLE)
        );
      });

      it('returns idle', () => {
        const status = workflowUtils.getWorkflowStatus(workflowNodes);
        expect(status).to.equal(statusConstants.IDLE);
      });
    });

    describe('when all running', () => {
      beforeEach(() => {
        workflowNodes = workflowNodes.map(workflowNode =>
          workflowNode.set('status', statusConstants.RUNNING)
        );
      });

      it('returns running', () => {
        const status = workflowUtils.getWorkflowStatus(workflowNodes);
        expect(status).to.equal(statusConstants.RUNNING);
      });
    });

    describe('when a mix of running, idle, and completed', () => {
      let workflowNodesIdleCompleted;
      let workflowNodesIdleRunning;
      let workflowNodesIdleRunningCompleted;
      let workflowNodesRunningCompleted;

      beforeEach(() => {
        workflowNodesIdleCompleted = workflowNodes.push(
          new WorkflowNodeRecord({ status: statusConstants.COMPLETED })
        );
        workflowNodesIdleRunning = workflowNodes.push(
          new WorkflowNodeRecord({ status: statusConstants.RUNNING })
        );
        workflowNodesIdleRunningCompleted = workflowNodes.push(
          new WorkflowNodeRecord({ status: statusConstants.RUNNING })
        ).push(
          new WorkflowNodeRecord({ status: statusConstants.COMPLETED })
        );
        workflowNodesRunningCompleted = new IList([
          new WorkflowNodeRecord({ status: statusConstants.RUNNING }),
          new WorkflowNodeRecord({ status: statusConstants.COMPLETED }),
        ]);
      });

      it('returns running', () => {
        const statusIdleCompleted = workflowUtils.getWorkflowStatus(
          workflowNodesIdleCompleted
        );
        const statusIdleRunning = workflowUtils.getWorkflowStatus(
          workflowNodesIdleCompleted
        );
        const statusIdleRunningCompleted = workflowUtils.getWorkflowStatus(
          workflowNodesIdleRunningCompleted
        );
        const statusRunningCompleted = workflowUtils.getWorkflowStatus(
          workflowNodesRunningCompleted
        );
        expect(statusIdleCompleted).to.equal(statusConstants.RUNNING);
        expect(statusIdleRunning).to.equal(statusConstants.RUNNING);
        expect(statusRunningCompleted).to.equal(statusConstants.RUNNING);
        expect(statusIdleRunningCompleted).to.equal(statusConstants.RUNNING);
      });
    });
  });
});
