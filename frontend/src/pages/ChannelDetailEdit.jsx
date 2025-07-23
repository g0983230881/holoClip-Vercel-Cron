import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Space, Switch, message, Spin } from 'antd';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import channelService from '../api/channelService'; // 引入 API 服務

const ChannelDetailEdit = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // 判斷是否為編輯模式
    setIsEditMode(location.pathname.endsWith('/edit'));

    const fetchChannel = async () => {
      setLoading(true);
      try {
        const channel = await channelService.getChannelById(channelId);
        form.setFieldsValue(channel);
      } catch (error) {
        message.error('獲取頻道詳情失敗');
        console.error('Failed to fetch channel:', error);
        navigate('/channels'); // 獲取失敗則返回列表頁
      } finally {
        setLoading(false);
      }
    };

    if (channelId) {
      fetchChannel();
    } else {
      setLoading(false);
    }
  }, [channelId, form, location.pathname, navigate]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await channelService.updateChannel(channelId, values);
      message.success('頻道資訊已儲存');
      navigate(`/channels/${channelId}`); // 儲存成功後返回詳情頁
    } catch (error) {
      message.error('儲存頻道資訊失敗');
      console.error('Failed to save channel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/channels');
  };

  return (
    <Spin spinning={loading}>
      <div>
        <h1>{isEditMode ? `編輯頻道: ${channelId}` : `頻道詳情: ${channelId}`}</h1>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ isVerified: false }}
        >
          <Form.Item name="channelId" label="頻道ID">
            <Input disabled />
          </Form.Item>
          <Form.Item name="subscriberCount" label="訂閱數">
            <Input disabled />
          </Form.Item>
          <Form.Item name="videoCount" label="影片數">
            <Input disabled />
          </Form.Item>
          <Form.Item name="thumbnailUrl" label="縮圖URL">
            <Input disabled />
          </Form.Item>
          <Form.Item name="lastUpdated" label="最後更新時間">
            <Input disabled />
          </Form.Item>
          <Form.Item name="createdAt" label="建立時間">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="channelName"
            label="頻道名稱"
            rules={[{ required: true, message: '請輸入頻道名稱!' }]}
          >
            <Input disabled={!isEditMode} />
          </Form.Item>
          <Form.Item name="isVerified" label="是否驗證" valuePropName="checked">
            <Switch disabled={!isEditMode} />
          </Form.Item>

          <Form.Item>
            <Space>
              {isEditMode && (
                <Button type="primary" htmlType="submit">
                  儲存
                </Button>
              )}
              <Button onClick={handleCancel}>
                取消
              </Button>
              <Button onClick={handleCancel}>
                返回
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </Spin>
  );
};

export default ChannelDetailEdit;
