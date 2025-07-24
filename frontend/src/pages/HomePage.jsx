import React, { useCallback, useEffect, useState } from 'react';
import { List, Input, Select, Row, Col, Typography, Spin, Pagination, Flex, Avatar, Button } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { fetchVideosAndChannels } from '../api/videoService';
import channelService from '../api/channelService';
import VideoCard from '../components/VideoCard';
import { useDebounce } from '../hooks/useDebounce';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const HomePage = () => {
    const [videos, setVideos] = useState([]);
    const [channels, setChannels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedChannel, setSelectedChannel] = useState(null);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 50,
        total: 0,
    });

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const getVideos = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                search: debouncedSearchTerm,
                channelId: selectedChannel ? selectedChannel.channelId : null,
                page: pagination.current - 1, // Spring Page is 0-indexed
                size: pagination.pageSize,
            };
            const response = await fetchVideosAndChannels(params);
            // The backend now returns a PageResponse object.
            setVideos(response.list || []);
            setPagination(prev => ({
                ...prev,
                total: response.total,
            }));
        } catch (error) {
            console.error("Failed to fetch videos:", error);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearchTerm, selectedChannel, pagination.current, pagination.pageSize]);

    useEffect(() => {
        getVideos();
    }, [getVideos]);

    useEffect(() => {
        const getChannels = async () => {
            try {
                // Pass empty params to get all channels; backend uses PageHelper.
                const channelsData = await channelService.getChannels({});
                // PageHelper's page object uses 'list', not 'content'. Fallback to empty array.
                setChannels(channelsData.list || []);
            } catch (error) {
                console.error("Failed to fetch channels:", error);
                setChannels([]); // Set to empty array on error to prevent crash
            }
        };
        getChannels();
    }, []);


    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({ ...prev, current: page, pageSize }));
    };

    const handleReset = () => {
        setSelectedChannel(null);
        setSearchTerm('');
    };

    return (
        <div>
            <div style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#e5e7eb', padding: '1px 0'}}>
                <Title
                    level={2}
                    style={{ textAlign: 'center', cursor: 'pointer', display: 'inline-block' }}
                    onClick={handleReset}
                >
                    Hololive 中文精華蒐集網
                </Title>
                <Row gutter={[16, 16]} style={{ marginBottom: 24, justifyContent: 'center', alignItems: 'center' }}>
                    <Col xs={24} md={6}>
                        <Button
                            type="link"
                            icon={<BugOutlined />}
                            href="https://forms.gle/QLY76i8PXY8DJZzT8"
                            target="_blank"
                            style={{ width: '100%' }}
                        >
                            回報問題/新增烤肉man頻道
                        </Button>
                    </Col>
                    <Col xs={24} md={6}>
                        <Search
                            placeholder="搜尋影片標題..."
                            value={searchTerm}
                            onSearch={value => setSearchTerm(value)}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ width: '100%' }}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <Select
                            placeholder="選擇頻道"
                            onChange={value => {
                                const channel = channels.find(c => c.channelId === value);
                                setSelectedChannel(channel);
                            }}
                            value={selectedChannel?.channelId}
                            style={{ width: '100%' }}
                            allowClear
                            getPopupContainer={triggerNode => triggerNode.parentNode}
                        >
                            {channels.map(channel => (
                                <Option key={channel.channelId} value={channel.channelId}>
                                    {channel.channelName}
                                </Option>
                            ))}
                        </Select>
                    </Col>
                    {selectedChannel && (
                        <Col xs={24} md={6}>
                            <Flex align="center" justify="center">
                                <Avatar src={selectedChannel.thumbnailUrl} style={{ marginRight: 8 }} />
                                <Typography.Text>{selectedChannel.channelName}</Typography.Text>
                            </Flex>
                        </Col>
                    )}
                </Row>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', margin: '50px 0' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <Flex vertical align="center" justify="center">
                    {videos.length === 1 ? (
                        <div style={{ width: '300px' }}>
                            <VideoCard video={videos[0]} hideChannelInfo={!!selectedChannel} />
                        </div>
                    ) : (
                        <List
                            grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }}
                            dataSource={videos}
                            renderItem={video => (
                                <List.Item>
                                    <VideoCard video={video} hideChannelInfo={!!selectedChannel} />
                                </List.Item>
                            )}
                        />
                    )}
                    <Pagination
                        style={{ marginTop: 20, textAlign: 'center' }}
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger={false}
                    />
                </Flex>
            )}
        </div>
    );
};

export default HomePage;