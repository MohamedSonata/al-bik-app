import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { CustomerInfo, DeliveryType } from '@/types/order.types';

interface CustomerInfoFormProps {
  onValidityChange: (isValid: boolean, customerInfo: CustomerInfo | null) => void;
}

export function CustomerInfoForm({ onValidityChange }: CustomerInfoFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');

  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    deliveryAddress: ''
  });

  // Validate form and notify parent
  useEffect(() => {
    const newErrors = {
      name: '',
      phone: '',
      deliveryAddress: ''
    };

    let isValid = true;

    // Validate name
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      newErrors.name = t('checkout.nameRequired');
      isValid = false;
    } else if (trimmedName.length < 2) {
      newErrors.name = t('checkout.nameTooShort');
      isValid = false;
    } else if (trimmedName.length > 100) {
      newErrors.name = t('checkout.nameTooLong');
      isValid = false;
    }

    // Validate phone
    if (phone.trim().length === 0) {
      newErrors.phone = t('checkout.phoneRequired');
      isValid = false;
    }

    // Validate delivery address if delivery type is delivery
    if (deliveryType === 'delivery') {
      const trimmedAddress = deliveryAddress.trim();
      if (trimmedAddress.length === 0) {
        newErrors.deliveryAddress = t('checkout.addressRequired');
        isValid = false;
      } else if (trimmedAddress.length < 10) {
        newErrors.deliveryAddress = t('checkout.addressTooShort');
        isValid = false;
      }
    }

    setErrors(newErrors);

    // Notify parent of validity state
    if (isValid) {
      const customerInfo: CustomerInfo = {
        name: trimmedName,
        phone: phone.trim(),
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress.trim() : undefined
      };
      onValidityChange(true, customerInfo);
    } else {
      onValidityChange(false, null);
    }
  }, [name, phone, deliveryType, deliveryAddress, onValidityChange, t]);

  return (
    <div className="space-y-6">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">
          {t('checkout.name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('checkout.namePlaceholder')}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          {t('checkout.phone')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t('checkout.phonePlaceholder')}
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
      </div>

      {/* Delivery Type Radio Group */}
      <div className="space-y-3">
        <Label>{t('checkout.deliveryType')} <span className="text-destructive">*</span></Label>
        <RadioGroup
          value={deliveryType}
          onValueChange={(value) => setDeliveryType(value as DeliveryType)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="font-normal cursor-pointer">
              {t('checkout.pickup')}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label htmlFor="delivery" className="font-normal cursor-pointer">
              {t('checkout.delivery')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Conditional Delivery Address */}
      {deliveryType === 'delivery' && (
        <div className="space-y-2">
          <Label htmlFor="deliveryAddress">
            {t('checkout.deliveryAddress')} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="deliveryAddress"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder={t('checkout.deliveryAddressPlaceholder')}
            className={errors.deliveryAddress ? 'border-destructive' : ''}
            rows={3}
          />
          {errors.deliveryAddress && (
            <p className="text-sm text-destructive">{errors.deliveryAddress}</p>
          )}
        </div>
      )}
    </div>
  );
}
