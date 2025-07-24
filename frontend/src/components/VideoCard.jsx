import React from 'react';
import { Card, Avatar, Typography, Flex } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-tw';

dayjs.extend(relativeTime);
dayjs.locale('zh-tw');

const { Title, Text } = Typography;

const VideoCard = ({ video, hideChannelInfo }) => {
  const timeFromNow = dayjs(video.publishedAt).fromNow();

  return (
    <Card
      hoverable
      cover={<img alt={video.title} src={video.thumbnailUrl} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />}
      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
      styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', height: '100%' } }}
    >
      <Title level={5} style={{ margin: 0, height: '3.2em', lineHeight: '1.6em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal', textAlign: 'center', marginBottom: '8px' }}>
        {video.title}
      </Title>
      {!hideChannelInfo && (
        <Flex align="" justify="center" style={{ marginTop: 'auto' }}>
          <Avatar size={40} src={video.channelThumbnailUrl || <UserOutlined />} />
          <Flex vertical style={{ marginLeft: '8px', minWidth: 0 }}>
          <Text style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{video.channelTitle}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{timeFromNow}</Text>
          </Flex>
        </Flex>
      )}
      {hideChannelInfo && (
        <Flex justify="center" style={{ marginTop: 'auto' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>{timeFromNow}</Text>
        </Flex>
      )}
    </Card>
  );
};

export default React.memo(VideoCard);
