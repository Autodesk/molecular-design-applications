import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { setProps, shallow } from 'enzyme';
import Workflow from '../../public/js/components/workflow';
import SelectionRecord from '../../public/js/records/selection_record';
import WorkflowRecord from '../../public/js/records/workflow_record';
import statusConstants from '../../../shared/status_constants';

describe('Workflow', () => {
  let clickAbout;
  let clickRun;
  let clickWorkflowNode;
  let clickWorkflowNodeLoad;
  let clickWorkflowNodeEmail;
  let initializeWorkflow;
  let onUpload;
  let runId;
  let selection;
  let submitPdbId;
  let submitEmail;
  let workflow;
  let workflowId;
  let workflowStatus;
  let wrapper;

  beforeEach(() => {
    clickAbout = () => {};
    clickRun = () => {};
    clickWorkflowNode = () => {};
    clickWorkflowNodeLoad = () => {};
    clickWorkflowNodeEmail = () => {};
    initializeWorkflow = () => {};
    onUpload = () => {};
    runId = '0';
    selection = new SelectionRecord();
    submitPdbId = () => {};
    submitEmail = () => {};
    workflowId = 'imaworkflowid';
    workflowStatus = statusConstants.IDLE;
    workflow = new WorkflowRecord({ id: workflowId });
  });

  describe('componentWillReceiveProps', () => {
    let initializeWorkflowSpy;

    beforeEach(() => {
      initializeWorkflowSpy = sinon.spy();
      wrapper = shallow(
        <Workflow
          clickAbout={clickAbout}
          clickRun={clickRun}
          clickWorkflowNode={clickWorkflowNode}
          clickWorkflowNodeLoad={clickWorkflowNodeLoad}
          clickWorkflowNodeEmail={clickWorkflowNodeEmail}
          initializeWorkflow={initializeWorkflowSpy}
          onUpload={onUpload}
          runId={runId}
          selection={selection}
          submitPdbId={submitPdbId}
          submitEmail={submitEmail}
          workflow={workflow}
          workflowId={workflowId} workflowStatus={workflowStatus} />
      );
    });

    describe('when the workflowId changes', () => {
      it('calls initializeWorkflow', () => {
        wrapper.setProps({ workflowId: 'newworkflowid' });

        expect(initializeWorkflowSpy.called).to.equal(true);
      });
    });

    describe('when the runId changes', () => {
      it('calls initializeWorkflow', () => {
        wrapper.setProps({ runId: 'newrunid' });

        expect(initializeWorkflowSpy.called).to.equal(true);
      });
    });

    describe('when the workflowId doesnt change', () => {
      it('doesnt call initializeWorkflow', () => {
        wrapper.setProps({ workflowId });

        expect(initializeWorkflowSpy.called).to.equal(false);
      });
    });

    describe('when the runId doesnt change', () => {
      it('doesnt call initializeWorkflow', () => {
        wrapper.setProps({ runId });

        expect(initializeWorkflowSpy.called).to.equal(false);
      });
    });

    describe('when the runId changes but we already have that run', () => {
      it('doesnt call initializeWorkflow', () => {
        const newRunId = 'newrunid';
        wrapper.setProps({
          runId: newRunId,
          workflow: new WorkflowRecord({
            id: workflowId,
            runId: newRunId,
          }),
        });

        expect(initializeWorkflowSpy.called).to.equal(false);
      });
    });
  });
});
