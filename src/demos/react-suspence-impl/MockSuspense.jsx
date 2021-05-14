import React from 'react';

class MockSuspense extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false, error: '' };
  }

  componentDidCatch(next) {
    if (next.then) {
      this.setState({ loading: true, error: '' });
    } else {
      this.setState({ loading: false, error: next });
    }
    return;
  }

  render() {
    const { children, fallback } = this.props;
    const { loading, error } = this.state;
    if (loading) {
      return fallback;
    }
    if (error) {
      return <div>{error}</div>;
    }
    return children;
  }
}

export default MockSuspense;
