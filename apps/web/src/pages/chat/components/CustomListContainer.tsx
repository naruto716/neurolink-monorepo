import { ChannelList, ChannelListMessengerProps } from "stream-chat-react";

const CustomChannelList = ({
  loadedChannels,
  children,
  loading,
  error,
}: React.PropsWithChildren<ChannelListMessengerProps>) => {
  if (loading) {
    return <div className='channel-list__placeholder'>⏳ Loading...</div>;
  }

  if (error) {
    return (
      <div className='channel-list__placeholder'>
        💣 Error loading channels
        <br />
        <button className='channel-list__button' onClick={() => window.location.reload()}>
          Reload page
        </button>
      </div>
    );
  }

  if (loadedChannels?.length === 0) {
    return <div className='channel-list__placeholder'>🤷 You have no channels... yet</div>;
  }

  return (
    <div className='channel-list' style={{ background: 'transparent' }}>
      {loadedChannels && (
        <div className='channel-list__counter'>{loadedChannels.length} channels:</div>
      )}
      {children}
    </div>
  );
};

<ChannelList List={CustomChannelList} sendChannelsToList />;
// Don't forget to provide filter and sort options as well!

export default CustomChannelList;