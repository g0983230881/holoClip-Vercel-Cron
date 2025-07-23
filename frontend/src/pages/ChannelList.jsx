import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Select, Input, Form, Popconfirm, message, Spin, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import channelService from '../api/channelService'; // 引入 API 服務

const { Option } = Select;

const ChannelList = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [sortParams, setSortParams] = useState({
    field: 'createdAt',
    order: 'descend',
  });

  const fetchChannels = async (page = 0, size = 20, filters = {}, sort = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        ...filters,
      };
      if (sort.field && sort.order) {
        params.sort = `${sort.field},${sort.order === 'descend' ? 'desc' : 'asc'}`;
      }
      const response = await channelService.getChannels(params);
      setChannels(response.content.map(channel => ({ ...channel, key: channel.channelId })));
      setPagination(prev => ({
        ...prev,
        total: response.totalElements,
        current: response.number + 1,
        pageSize: response.size,
      }));
    } catch (error) {
      message.error('獲取頻道列表失敗');
      console.error('Failed to fetch channels:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels(pagination.current - 1, pagination.pageSize, form.getFieldsValue(), sortParams);
  }, [pagination.current, pagination.pageSize, sortParams]);

  const handleVerifiedChange = async (channelId, checked) => {
    try {
      await channelService.updateChannel(channelId, { isVerified: checked });
      setChannels(prevChannels =>
        prevChannels.map(channel =>
          channel.channelId === channelId ? { ...channel, isVerified: checked } : channel
        )
      );
      message.success('驗證狀態已更新');
    } catch (error) {
      message.error('更新驗證狀態失敗');
    }
  };

  const handleBatchDelete = async () => {
    try {
      await channelService.deleteChannels(selectedRowKeys);
      message.success('選取的頻道已刪除');
      setSelectedRowKeys([]);
      fetchChannels(pagination.current - 1, pagination.pageSize, form.getFieldsValue(), sortParams);
    } catch (error) {
      message.error('刪除頻道失敗');
    }
  };

  const handleBatchVerify = async (isVerified) => {
    try {
      await channelService.batchUpdateVerificationStatus(selectedRowKeys, isVerified);
      setChannels(prevChannels =>
        prevChannels.map(channel =>
          selectedRowKeys.includes(channel.channelId)
            ? { ...channel, isVerified }
            : channel
        )
      );
      setSelectedRowKeys([]);
      message.success(`已將選取的所有頻道狀態更新為「${isVerified ? '是' : '否'}」`);
    } catch (error) {
      message.error('批次更新驗證狀態失敗');
    }
  };

  const columns = [
    {
      title: '頻道名稱',
      dataIndex: 'channelName',
      key: 'channelName',
      render: (text, record) => <a href={`https://www.youtube.com/channel/${record.channelId}`} target="_blank" rel="noopener noreferrer">{text}</a>,
    },
    {
      title: '訂閱數',
      dataIndex: 'subscriberCount',
      key: 'subscriberCount',
      sorter: true,
    },
    {
      title: '是否驗證',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified, record) => (
        <Space>
          <Switch
            checked={isVerified}
            onChange={(checked) => handleVerifiedChange(record.channelId, checked)}
          />
          <span>{isVerified ? '是' : '否'}</span>
        </Space>
      ),
    },
    {
      title: '備註',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: '最後更新時間',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button onClick={() => navigate(`/channels/${record.channelId}/edit`)}>編輯</Button>
          <Button onClick={() => navigate(`/channels/${record.channelId}`)}>查看詳情</Button>
        </Space>
      ),
    },
  ];

  const onFinish = (values) => {
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchChannels(0, pagination.pageSize, values, sortParams);
  };

  const onReset = () => {
    form.resetFields();
    setPagination(prev => ({ ...prev, current: 1 }));
    setSortParams({ field: 'createdAt', order: 'descend' });
    fetchChannels(0, pagination.pageSize, {}, { field: 'createdAt', order: 'descend' });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(pagination);
    if (sorter.field) {
      setSortParams({
        field: sorter.field,
        order: sorter.order,
      });
    } else {
      setSortParams({ field: 'createdAt', order: 'descend' });
    }
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  const hasSelected = selectedRowKeys.length > 0;

  return (
    <div>
      <h1>頻道列表</h1>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'white',
        padding: '16px 0',
        boxShadow: '0 2px 8px #f0f1f2'
      }}>
        {hasSelected ? (
          <Space>
            <span style={{ marginRight: 8 }}>{`已選取 ${selectedRowKeys.length} 個項目`}</span>
            <Button onClick={() => handleBatchVerify(true)}>全部設為是</Button>
            <Button onClick={() => handleBatchVerify(false)}>全部設為否</Button>
            <Popconfirm
              title={`確定要刪除這 ${selectedRowKeys.length} 個頻道嗎？`}
              onConfirm={handleBatchDelete}
              okText="是"
              cancelText="否"
            >
              <Button danger>刪除選取項目</Button>
            </Popconfirm>
          </Space>
        ) : (
          <Form
            form={form}
            name="channel_filter"
            layout="inline"
            onFinish={onFinish}
          >
            <Form.Item name="isVerified" label="是否驗證">
              <Select placeholder="請選擇" style={{ width: 120 }} allowClear>
                <Option value={true}>是</Option>
                <Option value={false}>否</Option>
              </Select>
            </Form.Item>
            <Form.Item name="channelName" label="頻道名稱">
              <Input placeholder="請輸入頻道名稱" />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  搜尋
                </Button>
                <Button onClick={onReset}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
        <Button type="primary" onClick={() => navigate('/channels/new')} style={{ marginLeft: 'auto' }}>
          新增頻道
        </Button>
      </div>
      <Spin spinning={loading}>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={channels}
          pagination={{
            ...pagination,
            showTotal: (total) => `共 ${total} 條`,
            showQuickJumper: true,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Spin>
    </div>
  );
};

export default ChannelList;
