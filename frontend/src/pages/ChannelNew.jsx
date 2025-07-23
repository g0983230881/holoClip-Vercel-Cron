import React, { useState } from 'react';
import { Form, Input, Button, Space, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import channelService from '../api/channelService'; // 引入 API 服務

const ChannelNew = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await channelService.addChannel(values);
      message.success('頻道已新增');
      navigate('/channels'); // 新增成功後返回列表頁
    } catch (error) {
      message.error(error.message || '新增頻道失敗');
      console.error('Failed to add channel:', error);
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
        <h1>新增頻道</h1>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="channelId"
            label="頻道ID"
            rules={[
              { required: true, message: '請輸入頻道ID!' },
              { pattern: /^[a-zA-Z0-9_-]{24}$/, message: '頻道ID格式不正確 (24位英數字元、_ 或 -)' },
            ]}
          >
            <Input placeholder="請輸入頻道ID" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                新增
              </Button>
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

export default ChannelNew;