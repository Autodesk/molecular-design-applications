import React from 'react';
import isEmail from 'validator/lib/isEmail';

require('../../css/status_email.scss');

class StatusEmail extends React.Component {
  constructor(props) {
    super(props);

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.state = {
      email: '',
      emailError: '',
    };
  }

  onChange(e) {
    this.setState({
      email: e.target.value,
    });
  }

  onSubmit(e) {
    e.preventDefault();

    if (!isEmail(this.state.email)) {
      return this.setState({
        emailError: 'Invalid email',
      });
    }

    this.props.submitEmail(this.state.email);

    return this.setState({
      emailError: '',
    });
  }

  render() {
    const sendText = this.props.email ?
      `We'll send you an email at ${this.props.email} when you start this calculation, and another when it's done.` : // eslint-disable-line max-len
      'We\'ll send you an email at when you start this calculation, and another when it\'s done.';

    return (
      <div className="status=info status-email">
        <p>
          This simulation might take about <span className="time">24 hours</span>.
        </p>
        <p>{sendText}</p>
        <form
          onSubmit={this.onSubmit}
        >
          <input
            className="enterEmail"
            style={{ width: '100%' }}
            type="email"
            autoComplete="email"
            placeholder="Enter email"
            value={this.state.email}
            onChange={this.onChange}
          />
          <p className="error">
            {this.state.emailError ? this.state.emailError : ''}
          </p>
        </form>
      </div>
    );
  }
}

StatusEmail.propTypes = {
  email: React.PropTypes.string.isRequired,
  submitEmail: React.PropTypes.func.isRequired,
};

export default StatusEmail;
